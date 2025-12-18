import type { Namespace, Socket, DefaultEventsMap } from 'socket.io';
import { prisma } from '../utils/prisma';
import { getRedisSync, redisClient, setRedisSync } from '../utils/backend/redis';
import { createLock, IoredisAdapter } from 'redlock-universal';
import type { Lobby, Game, ReidsLobbyPlayer, LobbyWordList, LobbyWord, LobbyGame, GivingClue, GameEvent, Voted } from '../../types/redis';
import { GameEventType, GameState, WinReason } from '../../types/redis';
import { isSameUser } from '../../app/utils/user';

export const waitForNextRound = 20 * 1000;
export const gameLobbyTtl = 5 * 60 * 60 * 1000;

const lobbyTimeouts = new Map<string, NodeJS.Timeout>();

export async function sendVoted(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const gameData = await getRedisSync(`game-${id}`) as string;
    const lobbyData = await getRedisSync(`lobby-${id}`) as string;

    if (!lobbyData || !socket.user?.userId || !gameData) return;

    const lobby: Lobby = JSON.parse(lobbyData);
    const game: Game = JSON.parse(gameData);

    const events = lobby.gameEvents.filter(x => x.gameNumber == lobby.gameNumber && x.round == game.round && x.turn == game.turn);
    const upVotes = events.filter(x => x.type == GameEventType.ReceivedUpVote);
    const downVotes = events.filter(x => x.type == GameEventType.ReceivedDownVote);
    const imposterVotes = events.filter(x => x.type == GameEventType.SaysImposer);

    const voted: Voted = {
        up: {
            num: upVotes.length,
            voted: upVotes.find(x => x.initiatorId == socket.user?.userId) != undefined,
        },
        down: {
            num: downVotes.length,
            voted: downVotes.find(x => x.initiatorId == socket.user?.userId) != undefined,
        },
        imposter: {
            num: imposterVotes.length,
            voted: imposterVotes.find(x => x.initiatorId == socket.user?.userId) != undefined,
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

    const resource = `locks:lobby-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !socket.user || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

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
                    eventType = GameEventType.SaysImposer;
                    break;
                }
                default: {
                    return;
                }
            }

            if (lobby.gameEvents.find(x => x.initiatorId == socket.user?.userId &&
                x.type == eventType &&
                x.turn == game.turn &&
                x.round == game.round &&
                x.gameNumber == lobby.gameNumber &&
                x.receiverId == game.turn)) {
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
                await setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);
                namespace.emit('voting');
            }

            await setRedisSync(`lobby-${id}`, JSON.stringify(lobby), gameLobbyTtl);
            socket.broadcast.emit('vote', eventNumber);
        }
    }
    finally {
        await lock.release(handle);
    }
}

function checkVoteImposter(game: Game, lobby: Lobby): boolean {
    return lobby.gameEvents.filter(x =>
        x.type == GameEventType.SaysImposer &&
        x.turn == game.turn &&
        x.round == game.round &&
        x.gameNumber == lobby.gameNumber
    ).length > lobby.players.length / 2;
}

export async function voteForPlayer(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, targetId: number, namespace: Namespace) {
    const resource = `locks:lobby-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !socket.user || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

        if (game.gameState !== GameState.Vote) return;

        const player = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false }));
        if (!player) return;

        // Check if already voted
        if (lobby.gameEvents.find(x => x.initiatorId == socket.user?.userId &&
            x.type == GameEventType.VotedForPlayer &&
            x.gameNumber == lobby.gameNumber)) {
            return;
        }

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

        await setRedisSync(`lobby-${id}`, JSON.stringify(lobby), gameLobbyTtl);

        // Check if everyone voted
        const votes = lobby.gameEvents.filter(x => x.type == GameEventType.VotedForPlayer && x.gameNumber == lobby.gameNumber);
        if (votes.length >= lobby.players.length) {
            await proceedFromVote(id, namespace);
        } else {
             namespace.emit('voteUpdate', votes.length);
        }
    }
    finally {
        await lock.release(handle);
    }
}

export async function proceedFromVote(id: string, namespace: Namespace) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

        if (game.gameState !== GameState.Vote) return;

        game.gameState = GameState.GameEnd;
        game.winReason = WinReason.Voted;
        await setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);

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
            } else if (count === maxVotes) {
                votedPlayerId = undefined; // Tie
            }
        });

        const votedPlayer = votedPlayerId ? lobby.players.find(p => p.id === votedPlayerId) : undefined;
        const imposterPlayer = lobby.players.find(p => p.id === game.imposter);

        namespace.emit('gameEnd', {
            votedPlayer: votedPlayer,
            imposterPlayer: imposterPlayer,
            wasCorrect: votedPlayerId === game.imposter,
            votes: lobby.gameRules.revealVotes ? votes : votes.map(v => ({ ...v, initiatorId: -1 })),
        });
    } finally {
        await lock.release(handle);
    }
}

export async function giveClue(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any, namespace: Namespace) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !socket.user || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

        const player = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false }));

        if (!player) return;

        if (isTurn(game, socket.user.userId)) {
            const clue: GivingClue = {
                clue: value,
                player: player,
            };

            socket.emit('givingClue', clue);
            socket.broadcast.emit('givingClue', clue);

            if (isRoundOver(game)) {
                game.round += 1;
            }
        }
        else return;

        // Prepare next game and set current game state
        game.gameState = GameState.Cue;
        game.cueEndTime = Date.now() + waitForNextRound;
        game.readyToContinue = [];

        setRedisSync(`game-${lobby.token}`, JSON.stringify(game), gameLobbyTtl);

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
    }
    finally {
        await lock.release(handle);
    }
}

export async function proceedFromCue(id: string, namespace: Namespace) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

        if (game.gameState !== GameState.Cue) return;

        if (game.round > lobby.gameRules.rounds) {
            game.gameState = GameState.GameEnd;
            setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);
            namespace.emit('gameEnd');
            return;
        }

        game.turn = nextPlayer(game, lobby);

        if (game.turn == game.turnOrder[0]) {
            // Round End
            game.gameState = GameState.RoundEnd;
            game.cueEndTime = Date.now() + waitForNextRound;
            game.readyToContinue = [];
            setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);
            namespace.emit('roundEnd');

            if (lobbyTimeouts.has(id)) {
                clearTimeout(lobbyTimeouts.get(id));
            }

            const timeout = setTimeout(async () => {
                await proceedFromRoundEnd(id, namespace);
            }, waitForNextRound);

            lobbyTimeouts.set(id, timeout);
        } else {
            // Next Turn
            game.gameState = GameState.Round;
            delete game.cueEndTime;
            delete game.readyToContinue;
            setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);
            namespace.emit('continue');
        }
    } finally {
        await lock.release(handle);
    }
}

export async function proceedFromRoundEnd(id: string, namespace: Namespace) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        if (!gameData) return;

        const game: Game = JSON.parse(gameData);

        if (game.gameState !== GameState.RoundEnd) return;

        game.gameState = GameState.Round;
        delete game.cueEndTime;
        delete game.readyToContinue;
        setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);
        namespace.emit('continue');
    } finally {
        await lock.release(handle);
    }
}

export async function nextGame(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, namespace: Namespace) {
    const resource = `locks:lobby-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !socket.user || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

        if (game.gameState !== GameState.GameEnd) return;

        // Check if owner
        if (!isSameUser(lobby.founder, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

        if (lobby.gameNumber < lobby.gameRules.games) {
            lobby.gameNumber += 1;
            await createGame(lobby);
            
            await setRedisSync(`lobby-${id}`, JSON.stringify(lobby), gameLobbyTtl);
            
            namespace.emit('start');
        } else {
            game.gameState = GameState.LobbyEnd;
            await setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);
            namespace.emit('lobbyEnd');
        }
    }
    finally {
        await lock.release(handle);
    }
}

export async function sendGame(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const gameData = await getRedisSync(`game-${id}`) as string;
    const lobbyData = await getRedisSync(`lobby-${id}`) as string;

    if (!lobbyData || !socket.user || !gameData) return;

    const lobby: Lobby = JSON.parse(lobbyData);
    const game: Game = JSON.parse(gameData);

    const isImposter = socket.user?.userId == game.imposter;
    const lobbyGame: LobbyGame = {
        round: game.round,
        turn: game.turn,
        word: (isImposter && game.gameState !== GameState.GameEnd && game.gameState !== GameState.ImposterVote) ? undefined : game.word,
        imposter: isImposter,
        gameState: game.gameState,
        cueEndTime: game.cueEndTime,
        readyToContinue: game.readyToContinue,
        imposterGuess: game.imposterGuess,
        winReason: game.winReason,
    };

    socket.emit('game', lobbyGame);
    socket.emit('lobby', lobby);
}

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

    setRedisSync(`game-${lobby.token}`, JSON.stringify(game), gameLobbyTtl);
}

function chooseImposter(players: ReidsLobbyPlayer[]): number {
    if (players.length === 0) throw new Error('players cant be 0');

    // Create a Uint32Array of length 1 for the random index
    const randomIndexArray = new Uint32Array(1);
    crypto.getRandomValues(randomIndexArray);
    const randomIndex = randomIndexArray[0]! % players.length;

    return players[randomIndex]!.id;
}

function makeTurnOrder(players: ReidsLobbyPlayer[]): number[] {
    const ids = players.map(p => p.id);

    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
        const array = new Uint32Array(1);

        crypto.getRandomValues(array);
        const array0 = array[0];
        if (!array0) throw new Error('empty array');
        const j = array0 % (i + 1);

        // Swap ids[i] and ids[j]
        [ids[i]!, ids[j]!] = [ids[j]!, ids[i]!];
    }

    return ids;
}

function nextPlayer(game: Game, lobby: Lobby): number {
    if (!game.turnOrder || game.turnOrder.length === 0) {
        throw new Error('Game is corrupted');
    }
    const currentIndex = game.turnOrder.indexOf(game.turn);
    if (currentIndex === -1) {
        throw new Error('Game is corrupted');
    }
    // next index, wrap around to 0 if at the end
    const nextIndex = (currentIndex + 1) % game.turnOrder.length;
    const nextPlayer = game.turnOrder[nextIndex];
    if (!nextPlayer) throw new Error('Game is corrupted');
    return nextPlayer;
}

function isRoundOver(game: Game): boolean {
    if (!game.turnOrder || game.turnOrder.length === 0) {
        throw new Error('Game is corrupted');
    }

    const currentIndex = game.turnOrder.indexOf(game.turn);
    // round over if current turn is last in turn order
    return currentIndex === (game.turnOrder.length - 1);
}

async function chooseRandomWord(wordLists: number[]): Promise<LobbyWord> {
    if (!wordLists || wordLists.length === 0) throw new Error('wordlist cant be empty');

    // Select random LobbyWordList
    const listIndex = Math.floor(Math.random() * wordLists.length);
    const wordListIndex = wordLists[listIndex] ?? -1;

    const wordList = await getCachedWordList(wordListIndex);

    if (wordList.words.length === 0) throw new Error('words in wordlist cant be empty');

    // Select random LobbyWord from chosen list
    const wordIndex = Math.floor(Math.random() * wordList.words.length);
    const word = wordList.words[wordIndex];
    if (!word) throw new Error('selected word empty');
    return word;
}

async function getCachedWordList(id: number): Promise<LobbyWordList> {
    const wordListData = await getRedisSync(`wordlist-${id}`);

    if (!wordListData) {
        const wordList = await cacheWordLists([id], true);
        if (!wordList) {
            throw new Error('Wordlist id not found');
        }

        const returnWortlist = wordList[0];
        if (!returnWortlist) throw new Error('wordlist is empty');
        return returnWortlist;
    }

    const wordList: LobbyWordList = JSON.parse(wordListData);

    return wordList;
}

async function cacheWordLists(wordLists: number[], skipSearch: boolean = false): Promise<LobbyWordList[] | undefined> {
    const searchLists: number[] = [];

    if (!skipSearch) {
        const exists: number[] = [];

        for (const n of wordLists) {
            const data = await getRedisSync(`wordlist-${n}`);
            if (data) {
                exists.push(n);
            }
        }

        const searchLists = wordLists.filter(n => !exists.includes(n));

        if (searchLists.length == 0) return;
    }
    else {
        for (const list of wordLists) {
            searchLists.push(list);
        }
    }

    const dbWordLists: LobbyWordList[] = await prisma.wordList.findMany({
        where: {
            id: {
                in: searchLists,
            },
        },
        select: {
            id: true,
            name: true,
            description: true,
            words: {
                select: {
                    word: true,
                    id: true,
                },
            },
        },
    });

    for (const list of dbWordLists) {
        setRedisSync(`wordlist-${list.id}`, JSON.stringify(list), 2 * 24 * 60 * 60 * 1000);
    }

    return dbWordLists;
}

function isTurn(game: Game, userId: number) {
    return game.turn == userId;
}

export async function skipWait(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, namespace: Namespace) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();
    let proceed = false;
    let currentGameState: GameState | undefined;

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !socket.user || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

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

        setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);

        if (!proceed) {
            namespace.emit('gameUpdate', {
                readyToContinue: game.readyToContinue,
            });
        }
    }
    finally {
        await lock.release(handle);
    }

    if (proceed && currentGameState !== undefined) {
        if (currentGameState === GameState.Cue) {
            await proceedFromCue(id, namespace);
        } else if (currentGameState === GameState.RoundEnd) {
            await proceedFromRoundEnd(id, namespace);
        } else if (currentGameState === GameState.Vote) {
            await proceedFromVote(id, namespace);
        }
    }
}

export async function guessWord(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: string, namespace: Namespace) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !socket.user || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

        // Only imposter can guess
        if (game.imposter !== socket.user.userId) return;

        if (game.gameState === GameState.GameEnd || game.gameState === GameState.LobbyEnd || game.gameState === GameState.Idle) return;

        game.imposterGuess = value;
        game.gameState = GameState.ImposterVote;
        
        await setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);

        namespace.emit('gameUpdate', {
            gameState: game.gameState,
            imposterGuess: game.imposterGuess,
        });

        setTimeout(async () => {
             await proceedFromImposterVote(id, namespace);
        }, 5000);

    } finally {
        await lock.release(handle);
    }
}

export async function proceedFromImposterVote(id: string, namespace: Namespace) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const gameData = await getRedisSync(`game-${id}`) as string;
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !gameData) return;

        const lobby: Lobby = JSON.parse(lobbyData);
        const game: Game = JSON.parse(gameData);

        if (game.gameState !== GameState.ImposterVote) return;

        game.gameState = GameState.GameEnd;
        game.winReason = WinReason.Guessed;
        await setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);

        const imposterPlayer = lobby.players.find(p => p.id === game.imposter);
        const wasCorrect = game.imposterGuess?.toLowerCase() === game.word.word.toLowerCase();

        namespace.emit('gameEnd', {
            votedPlayer: undefined,
            imposterPlayer: imposterPlayer,
            wasCorrect: wasCorrect,
            votes: [],
        });

    } finally {
        await lock.release(handle);
    }
}

