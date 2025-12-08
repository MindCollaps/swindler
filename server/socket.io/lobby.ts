import type { Namespace, Socket, DefaultEventsMap } from 'socket.io';
import { prisma } from '../utils/prisma';
import { LobbysWordListSelect } from '../../types/fetch';
import { getRedisSync, redisClient, setRedisSync } from '../utils/backend/redis';
import { createLock, IoredisAdapter } from 'redlock-universal';
import type { Lobby, Game, ReidsLobbyPlayer, LobbyWordList, LobbyWord, LobbyGame, GivingClue, GameEvent, Voted } from '../../types/redis';
import { GameEventType, GameState } from '../../types/redis';

const waitForNextRound = 10 * 1000;
const gameLobbyTtl = 5 * 60 * 60 * 1000;

export default async function lobbyHandler(namespace: Namespace, socket: Socket, id: string) {
    const userId = socket.user?.userId;
    const username = socket.user?.username;
    const fakeUser = socket.user?.fakeUser;

    if (!userId || !username || fakeUser == undefined) {
        console.log('No user id found!');
        return;
    }

    const resource = `locks:lobby-${id}`;

    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    let lobbyData: Lobby;

    try {
        const handle = await lock.acquire();

        const cachedLobby = await getRedisSync(`lobby-${id}`);

        if (!cachedLobby) {
            socket.emit('redirect', '/lobby');
            return;
        }
        else {
            lobbyData = JSON.parse(cachedLobby);
        }

        lobbyData.players = lobbyData.players.filter(e => !(e.id == userId && e.fakeUser == fakeUser));
        lobbyData.players.push({
            id: userId,
            username: username,
            ready: false,
            fakeUser: fakeUser,
        });

        setRedisSync(`lobby-${id}`, JSON.stringify(lobbyData), gameLobbyTtl);
        await lock.release(handle);

        socket.emit('lobby', lobbyData);
        socket.broadcast.emit('players', lobbyData.players);
    }
    catch (e) {
        console.error('Failed to acquire lock for lobby update', e);
    }

    socket.on('start', () => lobbyStart(socket, id));
    socket.on('addWord', value => addWordlist(socket, id, value));
    socket.on('removeWord', value => removeWordlist(socket, id, value));
    socket.on('giveClue', value => giveClue(socket, id, value));
    socket.on('vote', value => vote(socket, id, value));
    socket.on('ready', value => ready(socket, id, value));

    // TODO: imposter can guess what the word is

    socket.on('game', () => sendGame(socket, id));

    sendVoted(socket, id);

    socket.on('disconnect', async () => {
        const cachedLobby = await getRedisSync(`lobby-${id}`);
        if (!cachedLobby || !socket.user) return;
        const lobbyData: Lobby = JSON.parse(cachedLobby);

        lobbyData.players = lobbyData.players.filter(e => !(e.id == userId && e.fakeUser == fakeUser));
        setRedisSync(`lobby-${id}`, JSON.stringify(lobbyData), gameLobbyTtl);

        namespace.emit('players', lobbyData.players);
    });

    const asyncWordlist = async () => {
        const wordLists = await prisma.wordList.findMany({
            where: {
                OR: [
                    { fromUserId: userId },
                    { public: true },
                    { shared: true, sharedLists: { some: { userId: userId } } },
                ],
            },
            select: LobbysWordListSelect,
        });

        socket.emit('wordLists', wordLists);
    };

    asyncWordlist();
}

async function sendVoted(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
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

async function ready(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, ready: boolean) {
    const resource = `locks:lobby-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const lobbyData = await getRedisSync(`lobby-${id}`) as string;

        if (!lobbyData || !socket.user) return;

        const lobby: Lobby = JSON.parse(lobbyData);

        const player = lobby.players.find(x => x.id == socket.user?.userId && x.fakeUser == socket.user.fakeUser);

        if (!player) return;

        player.ready = ready;

        setRedisSync(`lobby-${id}`, JSON.stringify(lobby), gameLobbyTtl);
        socket.broadcast.emit('players', lobby.players);
    }
    finally {
        await lock.release(handle);
    }
}

async function vote(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
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

        const player = lobby.players.find(x => x.id == socket.user?.userId && x.fakeUser == socket.user.fakeUser);

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
                    console.log('already logged');
                // Event was already logged
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

async function giveClue(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
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

        const player = lobby.players.find(x => x.id == socket.user?.userId && x.fakeUser == socket.user.fakeUser);

        if (!player) return;

        if (isTurn(game, socket.user.userId)) {
            const clue: GivingClue = {
                clue: value,
                player: player,
            };

            socket.emit('givingClue', clue);
            socket.broadcast.emit('givingClue', clue);
            if (isRoundOver(game)) {
                // Round is over!
                game.round += 1;
                if (game.round >= lobby.gameRules.rounds) {
                    // Game is over!
                    lobby.gameNumber += 1;

                    setTimeout(async () => {
                        await setGameSate(socket, id, GameState.GameEnd);
                        socket.broadcast.emit('gameEnd');
                        socket.emit('gameEnd');
                    }, waitForNextRound);

                    game.gameState = GameState.Cue;

                    setRedisSync(`game-${lobby.token}`, JSON.stringify(game), gameLobbyTtl);
                    return;
                }

                // Round is over!
                setTimeout(async () => {
                    if((await getGameState(id)) == GameState.Vote) return sendVoting(socket);
                    await setGameSate(socket, id, GameState.RoundEnd);
                    socket.broadcast.emit('roundEnd');
                    socket.emit('roundEnd');

                    setTimeout(async () => {
                        if((await getGameState(id)) == GameState.Vote) return sendVoting(socket);
                        await setGameSate(socket, id, GameState.Round);
                        socket.broadcast.emit('continue');
                        socket.emit('continue');
                    }, waitForNextRound);
                }, waitForNextRound);
            }
            else {
                // Round is not over!
                setTimeout(async () => {
                    if((await getGameState(id)) == GameState.Vote) return sendVoting(socket);
                    await setGameSate(socket, id, GameState.Round);
                    socket.broadcast.emit('continue');
                    socket.emit('continue');
                }, waitForNextRound);
            }
        }
        else return;

        // Prepare next game and set current game state
        game.turn = nextPlayer(game, lobby);
        game.gameState = GameState.Cue;
        setRedisSync(`game-${lobby.token}`, JSON.stringify(game), gameLobbyTtl);
    }
    finally {
        await lock.release(handle);
    }
}

function sendVoting(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.broadcast.emit('voting');
    socket.emit('voting');
}

async function getGameState(id: string): Promise<GameState | undefined> {
    const gameData = await getRedisSync(`game-${id}`) as string;

    if (!gameData) return;

    const game: Game = JSON.parse(gameData);
    return game.gameState;
}

async function setGameSate(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, gameState: GameState) {
    const resource = `locks:game-${id}`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();
    try {
        const gameData = await getRedisSync(`game-${id}`) as string;

        if (!socket.user || !gameData) return;

        const game: Game = JSON.parse(gameData);

        game.gameState = gameState;

        setRedisSync(`game-${id}`, JSON.stringify(game), gameLobbyTtl);
    }
    finally {
        await lock.release(handle);
    }
}

async function lobbyStart(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const lobbyData = await getRedisSync(`lobby-${id}`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (!isOwner(lobby, socket.user.userId)) return;

    if (lobby.players.filter(x => x.ready).length != lobby.players.length) return;

    await createGame(lobby);

    socket.emit('start');
    socket.broadcast.emit('start');
}

async function sendGame(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const gameData = await getRedisSync(`game-${id}`) as string;
    const lobbyData = await getRedisSync(`lobby-${id}`) as string;

    if (!lobbyData || !socket.user || !gameData) return;

    const lobby: Lobby = JSON.parse(lobbyData);
    const game: Game = JSON.parse(gameData);

    const isImposter = socket.user?.userId == game.imposter;
    const lobbyGame: LobbyGame = {
        round: game.round,
        turn: game.turn,
        word: isImposter ? undefined : game.word,
        imposter: isImposter,
        gameState: game.gameState,
    };

    socket.emit('game', lobbyGame);
    socket.emit('lobby', lobby);
}

async function addWordlist(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    const lobbyData = await getRedisSync(`lobby-${id}`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (!isOwner(lobby, socket.user.userId)) return;

    if (lobby.wordLists.indexOf(value) == -1) {
        lobby.wordLists.push(value);
        setRedisSync(`lobby-${id}`, JSON.stringify(lobby), gameLobbyTtl);

        socket.emit('lobbyWordLists', lobby.wordLists);
        socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
    }
}

async function removeWordlist(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    const lobbyData = await getRedisSync(`lobby-${id}`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (!isOwner(lobby, socket.user.userId)) return;
    if (lobby.wordLists.indexOf(value) != -1) {
        lobby.wordLists = lobby.wordLists.filter(x => x != value);
        setRedisSync(`lobby-${id}`, JSON.stringify(lobby), gameLobbyTtl);

        socket.emit('lobbyWordLists', lobby.wordLists);
        socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
    }
}

async function createGame(lobby: Lobby) {
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

function isOwner(lobby: Lobby, userId: number) {
    return lobby.founder.id == userId;
}

function isTurn(game: Game, userId: number) {
    return game.turn == userId;
}
