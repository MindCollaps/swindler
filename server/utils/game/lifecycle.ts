import type { Namespace } from 'socket.io';
import { withLock, getGameAndLobby, getGame, saveGame, saveLobby, lobbyTimeouts, waitForNewRound } from './helper';
import { GameEventType, GameState, WinReason } from '../../../types/redis';
import type { Lobby, Game } from '../../../types/redis';
import { nextPlayer, chooseImposter, makeTurnOrder } from './rules';
import { chooseRandomWord } from './words';
import { calculateLobbyStats } from './stats';

export async function createGame(lobby: Lobby) {
    const turnOrder = makeTurnOrder(lobby.players);
    const randomWord = await chooseRandomWord(lobby.wordLists);

    const game: Game = {
        specialGameMode: 0,
        imposter: chooseImposter(lobby.players),
        round: 1,
        turnOrder: turnOrder,
        turn: turnOrder[0]!,
        word: randomWord,
        gameState: GameState.Round,
    };

    await saveGame(lobby.token, game);
}

export async function proceedFromVote(id: string, namespace: Namespace) {
    await withLock(id, 'game', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !game) return;

        if (game.gameState !== GameState.Vote) return;

        game.gameState = GameState.GameEnd;
        game.winReason = WinReason.Voted;
        await saveGame(id, game);

        // Calculate results
        const votes = lobby.gameEvents.filter(x => x.type == GameEventType.VotedForPlayer && x.gameNumber == lobby.gameNumber);
        const voteCounts = new Map<number, number>();
        votes.forEach(v => {
            if (v.receiverId) {
                voteCounts.set(v.receiverId, (voteCounts.get(v.receiverId) || 0) + 1);
            }
        });

        let maxVotes = 0;
        let votedPlayerId: number | undefined;
        voteCounts.forEach((count, playerId) => {
            if (count > maxVotes) {
                maxVotes = count;
                votedPlayerId = playerId;
            }
            else if (count === maxVotes) {
                votedPlayerId = undefined; // Tie
            }
        });

        const votedPlayer = votedPlayerId ? lobby.players.find(p => p.id === votedPlayerId) : undefined;
        const imposterPlayer = lobby.players.find(p => p.id === game.imposter);

        // Log VotedCorrectly / VotedIncorrectly
        votes.forEach(v => {
            if (v.initiatorId === game.imposter) return; // Imposter wont receive event

            if (v.receiverId === game.imposter) {
                lobby.gameEvents.push({
                    initiatorId: v.initiatorId,
                    receiverId: v.receiverId,
                    triggered: new Date(),
                    type: GameEventType.VotedCorrectly,
                    round: game.round,
                    turn: game.turn,
                    gameNumber: lobby.gameNumber,
                });
            }
            else {
                lobby.gameEvents.push({
                    initiatorId: v.initiatorId,
                    receiverId: v.receiverId,
                    triggered: new Date(),
                    type: GameEventType.VotedIncorrectly,
                    round: game.round,
                    turn: game.turn,
                    gameNumber: lobby.gameNumber,
                });
            }
        });

        await gameEnd(id, lobby, game);

        namespace.emit('gameEnd', {
            votedPlayer: votedPlayer,
            imposterPlayer: imposterPlayer,
            wasCorrect: votedPlayerId === game.imposter,
            votes: lobby.gameRules.revealVotes ? votes : votes.map(v => ({ ...v, initiatorId: -1 })),
        });
    });
}

export async function proceedFromCue(id: string, namespace: Namespace) {
    await withLock(id, 'game', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !game) return;

        if (game.gameState !== GameState.Cue) return;

        if (game.round > lobby.gameRules.rounds) {
            game.gameState = GameState.GameEnd;
            await saveGame(id, game);
            namespace.emit('gameEnd');
            return;
        }

        game.turn = nextPlayer(game, lobby);

        if (game.turn == game.turnOrder[0]) {
            // Round End
            game.gameState = GameState.RoundEnd;
            game.cueEndTime = Date.now() + waitForNewRound;
            game.readyToContinue = [];
            await saveGame(id, game);
            namespace.emit('roundEnd');
            namespace.emit('gameUpdate', {
                cueEndTime: game.cueEndTime,
                readyToContinue: game.readyToContinue,
            });

            if (lobbyTimeouts.has(id)) {
                clearTimeout(lobbyTimeouts.get(id));
            }

            const timeout = setTimeout(async () => {
                await proceedFromRoundEnd(id, namespace);
            }, waitForNewRound);

            lobbyTimeouts.set(id, timeout);
        }
        else {
            // Next Turn
            game.gameState = GameState.Round;
            delete game.cueEndTime;
            delete game.readyToContinue;
            await saveGame(id, game);
            namespace.emit('continue');
        }
    });
}

export async function proceedFromRoundEnd(id: string, namespace: Namespace) {
    await withLock(id, 'game', async () => {
        const game = await getGame(id);
        if (!game) return;

        if (game.gameState !== GameState.RoundEnd) return;

        game.gameState = GameState.Round;
        delete game.cueEndTime;
        delete game.readyToContinue;
        game.round += 1;

        await saveGame(id, game);

        namespace.emit('continue');
    });
}

export async function proceedFromImposterVote(id: string, namespace: Namespace) {
    await withLock(id, 'game', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !game) return;

        if (game.gameState !== GameState.ImposterVote) return;

        game.gameState = GameState.GameEnd;
        game.winReason = WinReason.Guessed;
        await saveGame(id, game);

        const imposterPlayer = lobby.players.find(p => p.id === game.imposter);
        const wasCorrect = game.imposterGuess?.toLowerCase() === game.word.word.toLowerCase();

        await gameEnd(id, lobby, game);

        namespace.emit('gameEnd', {
            votedPlayer: undefined,
            imposterPlayer: imposterPlayer,
            wasCorrect: wasCorrect,
            votes: [],
        });
    });
}

async function gameEnd(id: string, lobby: Lobby, game: Game) {
    lobby.stats = calculateLobbyStats(lobby);
    lobby.gameRunning = false;
    lobby.gameStarted = true;
    lobby.players.forEach(p => p.ready = false);

    await saveLobby(id, lobby);
}
