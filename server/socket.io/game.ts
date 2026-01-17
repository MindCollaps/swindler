import type { Namespace, Socket, DefaultEventsMap } from 'socket.io';
import type { GameEvent, Voted, GivingClue, WordSaid, LobbyGame } from '../../types/redis';
import { GameEventType, GameState } from '../../types/redis';
import { isSameUser } from '../../app/utils/user';
import {
    getGameAndLobby, getGame, saveGame, saveLobby, withLock,
    waitForNextRound, lobbyTimeouts, gameLobbyTtl, isOwner,
} from '../utils/game/helper';
import { checkVoteImposter, isTurn } from '../utils/game/rules';
import { createGame, proceedFromVote, proceedFromCue, proceedFromRoundEnd, proceedFromImposterVote } from '../utils/game/lifecycle';

export { waitForNextRound, gameLobbyTtl, createGame, proceedFromVote, proceedFromCue, proceedFromRoundEnd, proceedFromImposterVote };

export async function returnToLobby(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    await withLock(id, 'game', async () => {
        const { game, lobby } = await getGameAndLobby(id);
        if (!lobby || !socket.user?.userId || !game) return;

        if (!(game.gameState == GameState.GameEnd || game.gameState == GameState.LobbyEnd)) return;

        if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

        if (lobby.players.filter(x => x.ready).length != lobby.players.length) {
            socket.emit('errorMessage', 'Not all players are ready!');
            return;
        }

        lobby.gameRunning = false;

        await saveLobby(id, lobby);

        socket.emit('returnToLobby');
        socket.broadcast.emit('returnToLobby');
    });
}

export async function sendVoted(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const { game, lobby } = await getGameAndLobby(id);

    if (!lobby || !socket.user?.userId || !game) return;

    const events = lobby.gameEvents.filter(x => x.gameNumber == lobby.gameNumber && x.round == game.round && x.turn == game.turn);
    const upVotes = events.filter(x => x.type == GameEventType.ReceivedUpVote);
    const downVotes = events.filter(x => x.type == GameEventType.ReceivedDownVote);
    const imposterVotes = events.filter(x => x.type == GameEventType.SaysImposter);

    const voted: Voted = {
        up: {
            voted: upVotes.find(x => x.initiatorId == socket.user?.userId) != undefined,
            voters: upVotes.map(x => x.initiatorId),
        },
        down: {
            voted: downVotes.find(x => x.initiatorId == socket.user?.userId) != undefined,
            voters: downVotes.map(x => x.initiatorId),
        },
        imposter: {
            voted: imposterVotes.find(x => x.initiatorId == socket.user?.userId) != undefined,
            voters: imposterVotes.map(x => x.initiatorId),
        },
    };

    socket.emit('voted', voted);
}

export async function vote(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any, namespace: Namespace) {
    const eventNumber = value as number;
    if (eventNumber == 4) {
        socket.broadcast.emit('vote', 4);
        return;
    }

    await withLock(id, 'lobby', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !socket.user || !game) return;

        const player = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false }));

        if (!player) return;

        if (!isTurn(game, socket.user.userId) || eventNumber == 3) {
            let eventType: GameEventType;

            switch (eventNumber) {
                case 1: {
                    eventType = GameEventType.ReceivedDownVote;
                    break;
                }
                case 2: {
                    eventType = GameEventType.ReceivedUpVote;
                    break;
                }
                case 3: {
                    eventType = GameEventType.SaysImposter;
                    break;
                }
                default: {
                    return;
                }
            }

            const existingVoteIndex = lobby.gameEvents.findIndex(x => x.initiatorId == socket.user?.userId &&
                x.type == eventType &&
                x.turn == game.turn &&
                x.round == game.round &&
                x.gameNumber == lobby.gameNumber &&
                x.receiverId == game.turn);

            if (existingVoteIndex !== -1) {
                // Remove existing vote
                lobby.gameEvents.splice(existingVoteIndex, 1);
                await saveLobby(id, lobby);

                const unvoteData = {
                    vote: eventNumber,
                    userId: socket.user?.userId,
                };
                socket.broadcast.emit('unvote', unvoteData);
                return;
            }

            const gameEvent: GameEvent = {
                initiatorId: socket.user.userId,
                round: game.round,
                turn: game.turn,
                triggered: new Date(),
                receiverId: game.turn,
                type: eventType,
                gameNumber: lobby.gameNumber,
            };

            lobby.gameEvents.push(gameEvent);

            if (checkVoteImposter(game, lobby)) {
                game.gameState = GameState.Vote;
                await saveGame(id, game);
                namespace.emit('voting');
            }

            await saveLobby(id, lobby);
            const voteData = {
                vote: eventNumber,
                userId: socket.user?.userId,
            };
            socket.broadcast.emit('vote', voteData);
        }
    });
}

export async function voteForPlayer(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, targetId: number, namespace: Namespace) {
    await withLock(id, 'lobby', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !socket.user || !game) return;

        if (game.gameState !== GameState.Vote) return;

        const player = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false }));
        if (!player) return;

        // Check if already voted
        const existingVoteIndex = lobby.gameEvents.findIndex(x => x.initiatorId == socket.user?.userId &&
            x.type == GameEventType.VotedForPlayer &&
            x.gameNumber == lobby.gameNumber);

        if (existingVoteIndex !== -1) {
            const existingVote = lobby.gameEvents[existingVoteIndex];
            if (existingVote) {
                // Check if voted for same person -> Unvote
                if (existingVote.receiverId === targetId) {
                    lobby.gameEvents.splice(existingVoteIndex, 1);
                }
                else {
                    // Change vote
                    existingVote.receiverId = targetId;
                    existingVote.triggered = new Date();
                }
            }
        }
        else {
            const gameEvent: GameEvent = {
                initiatorId: socket.user.userId,
                receiverId: targetId,
                round: game.round,
                turn: game.turn,
                triggered: new Date(),
                type: GameEventType.VotedForPlayer,
                gameNumber: lobby.gameNumber,
            };
            lobby.gameEvents.push(gameEvent);
        }

        await saveLobby(id, lobby);

        // Emit updated lobby to everyone so they see votes
        namespace.emit('lobby', lobby);

        // Check if everyone voted
        const votes = lobby.gameEvents.filter(x => x.type == GameEventType.VotedForPlayer && x.gameNumber == lobby.gameNumber);
        if (votes.length >= lobby.players.length) {
            await proceedFromVote(id, namespace);
        }
        else {
            namespace.emit('voteUpdate', votes.length);
        }
    });
}

export async function giveClue(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any, namespace: Namespace) {
    if (value.length < 1) {
        socket.emit('errorMessage', 'You have to give a clue!');
        return;
    }

    await withLock(id, 'game', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !socket.user || !game) return;

        const player = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false }));

        if (!player) return;

        if (isTurn(game, socket.user.userId)) {
            const clue: GivingClue = {
                clue: value,
                player: player,
            };

            const wordSaid: WordSaid = {
                playerId: player.id,
                word: value,
                round: game.round,
                turn: game.turn,
                gameNumber: lobby.gameNumber,
            };

            lobby.wordsSaid.push(wordSaid);

            await saveLobby(id, lobby);

            socket.emit('givingClue', clue);
            socket.broadcast.emit('givingClue', clue);
        }
        else return;

        // Prepare next game and set current game state
        game.gameState = GameState.Cue;
        game.cueEndTime = Date.now() + waitForNextRound;
        game.readyToContinue = [];

        await saveGame(id, game);

        namespace.emit('gameUpdate', {
            cueEndTime: game.cueEndTime,
            readyToContinue: game.readyToContinue,
        });

        if (lobbyTimeouts.has(id)) {
            clearTimeout(lobbyTimeouts.get(id));
        }

        const timeout = setTimeout(async () => {
            await proceedFromCue(id, namespace);
        }, waitForNextRound);

        lobbyTimeouts.set(id, timeout);
    });
}

export async function skipWait(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, namespace: Namespace) {
    let proceed = false;
    let currentGameState: GameState | undefined;

    await withLock(id, 'game', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !socket.user || !game) return;

        if (game.gameState !== GameState.Cue && game.gameState !== GameState.RoundEnd && game.gameState !== GameState.Vote) return;

        if (!game.readyToContinue) game.readyToContinue = [];

        if (game.readyToContinue.includes(socket.user.userId)) return;

        game.readyToContinue.push(socket.user.userId);

        const activePlayerIds = lobby.players.map(p => p.id);
        game.readyToContinue = game.readyToContinue.filter(id => activePlayerIds.includes(id));

        if (game.readyToContinue.length >= lobby.players.length) {
            proceed = true;
            currentGameState = game.gameState;
            if (lobbyTimeouts.has(id)) {
                clearTimeout(lobbyTimeouts.get(id));
                lobbyTimeouts.delete(id);
            }
        }

        await saveGame(id, game);

        if (!proceed) {
            namespace.emit('gameUpdate', {
                readyToContinue: game.readyToContinue,
            });
        }
    });

    if (proceed && currentGameState !== undefined) {
        if (currentGameState === GameState.Cue) {
            await proceedFromCue(id, namespace);
        }
        else if (currentGameState === GameState.RoundEnd) {
            await proceedFromRoundEnd(id, namespace);
        }
        else if (currentGameState === GameState.Vote) {
            await proceedFromVote(id, namespace);
        }
    }
}

export async function guessWord(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: string, namespace: Namespace) {
    await withLock(id, 'game', async () => {
        const game = await getGame(id);

        if (!socket.user || !game) return;

        // Only imposter can guess
        if (game.imposter !== socket.user.userId) return;

        if (game.gameState === GameState.GameEnd || game.gameState === GameState.LobbyEnd || game.gameState === GameState.Idle) return;

        game.imposterGuess = value;
        game.gameState = GameState.ImposterWord;

        await saveGame(id, game);

        namespace.emit('gameUpdate', {
            gameState: game.gameState,
            imposterGuess: game.imposterGuess,
        });

        setTimeout(async () => {
            await proceedFromImposterVote(id, namespace);
        }, 5000);
    });
}

export async function nextGame(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, namespace: Namespace) {
    await withLock(id, 'lobby', async () => {
        const { game, lobby } = await getGameAndLobby(id);

        if (!lobby || !socket.user || !game) return;

        if (game.gameState !== GameState.GameEnd) return;

        // Check if owner
        if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

        if (lobby.gameNumber < lobby.gameRules.games) {
            lobby.gameNumber += 1;
            await createGame(lobby);

            await saveLobby(id, lobby);

            namespace.emit('start');
        }
        else {
            game.gameState = GameState.LobbyEnd;
            lobby.gameRunning = false;
            await saveGame(id, game);
            await saveLobby(id, lobby);
            namespace.emit('lobby', lobby);
            namespace.emit('lobbyEnd');
        }
    });
}

export async function sendGame(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const { game, lobby } = await getGameAndLobby(id);

    if (!lobby || !socket.user || !game) return;

    const isImposter = socket.user?.userId == game.imposter;
    const playerIsMember = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false })) != undefined;

    const lobbyGame: LobbyGame = {
        round: game.round,
        turn: game.turn,
        ...(((isImposter || !playerIsMember) && game.gameState !== GameState.GameEnd && game.gameState !== GameState.ImposterWord) ? { } : { word: game.word }),
        imposter: isImposter,
        gameState: game.gameState,
        cueEndTime: game.cueEndTime,
        readyToContinue: game.readyToContinue,
        imposterGuess: game.imposterGuess,
        winReason: game.winReason,
        turnOrder: game.turnOrder,
    };

    socket.emit('game', lobbyGame);
    socket.emit('lobby', lobby);
}
