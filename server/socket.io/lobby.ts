import type { Namespace, Socket, DefaultEventsMap } from 'socket.io';
import { prisma } from '../utils/prisma';
import { LobbysWordListSelect } from '../../types/fetch';
import { getRedisSync, redisClient, setRedisSync } from '../utils/backend/redis';
import { createLock, IoredisAdapter } from 'redlock-universal';
import type { Lobby, Game, ReidsLobbyPlayer, LobbyWordList, LobbyWord, LobbyGame } from '../../types/redis';

export default async function lobbyHandler(namespace: Namespace, socket: Socket, id: string) {
    const userId = socket.user?.userId;
    const username = socket.user?.username;

    if (!userId || !username) {
        console.log('No user id found!');
        return;
    }

    const resource = `locks:lobby-${ id }`;

    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    let lobbyData: Lobby;

    try {
        const handle = await lock.acquire();

        const cachedLobby = await getRedisSync(`lobby-${ id }`);

        if (!cachedLobby) {
            socket.emit('redirect', '/lobby');
            return;
        }
        else {
            lobbyData = JSON.parse(cachedLobby);
        }

        lobbyData.players = lobbyData.players.filter(e => e.id != userId);
        lobbyData.players.push({
            id: userId,
            username: socket.user?.username ?? 'Anonymous',
        });

        setRedisSync(`lobby-${ id }`, JSON.stringify(lobbyData), 5 * 60 * 60 * 1000);
        await lock.release(handle);

        socket.emit('lobby', lobbyData);
        socket.broadcast.emit('players', lobbyData.players);
    }
    catch (e) {
        console.error('Failed to acquire lock for lobby update', e);
    }

    socket.on('start', () => lobbyStart(socket, id));
    socket.on('addWord', value => addWord(socket, id, value));
    socket.on('removeWord', value => removeWord(socket, id, value));

    socket.on('game', () => sendGame(socket, id));

    socket.on('disconnect', async () => {
        const cachedLobby = await getRedisSync(`lobby-${ id }`);
        if (!cachedLobby || !socket.user) return;
        const lobbyData: Lobby = JSON.parse(cachedLobby);

        lobbyData.players = lobbyData.players.filter(e => e.id != userId);
        setRedisSync(`lobby-${ id }`, JSON.stringify(lobbyData), 5 * 60 * 60 * 1000);

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

async function lobbyStart(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const lobbyData = await getRedisSync(`lobby-${ id }`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (!isOwner(lobby, socket.user.userId)) return;

    await createGame(lobby);

    socket.emit('start');
    socket.broadcast.emit('start');
}

async function sendGame(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const gameData = await getRedisSync(`game-${ id }`) as string;
    const game: Game = JSON.parse(gameData);
    const lobbyGame: LobbyGame = {
        round: game.round,
        turn: game.turn,
        word: game.word,
        imposter: socket.user?.userId == game.imposter,
    };
    socket.emit('game', lobbyGame);
}

async function addWord(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    const lobbyData = await getRedisSync(`lobby-${ id }`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (!isOwner(lobby, socket.user.userId)) return;

    if (lobby.wordLists.indexOf(value) == -1) {
        lobby.wordLists.push(value);
        setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), 5 * 60 * 60 * 1000);

        socket.emit('lobbyWordLists', lobby.wordLists);
        socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
    }
}

async function removeWord(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    const lobbyData = await getRedisSync(`lobby-${ id }`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (!isOwner(lobby, socket.user.userId)) return;
    if (lobby.wordLists.indexOf(value) != -1) {
        lobby.wordLists = lobby.wordLists.filter(x => x != value);
        setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), 5 * 60 * 60 * 1000);

        socket.emit('lobbyWordLists', lobby.wordLists);
        socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
    }
}

function isOwner(lobby: Lobby, userId: number) {
    return lobby.founder.id == userId;
}

async function createGame(lobby: Lobby) {
    const turnOrder = makeTurnOrder(lobby.players);
    const randomWord = await chooseRandomWord(lobby.wordLists);

    const game: Game = {
        specialGameMode: 0,
        imposter: chooseImposter(lobby.players),
        round: 0,
        turnOrder: turnOrder,
        turn: turnOrder[0],
        word: randomWord,
    };

    setRedisSync(`game-${ lobby.token }`, JSON.stringify(game), 5 * 60 * 60 * 1000);
}

function chooseImposter(players: ReidsLobbyPlayer[]): number {
    if (players.length === 0) throw new Error('players cant be 0');

    // Create a Uint32Array of length 1 for the random index
    const randomIndexArray = new Uint32Array(1);
    crypto.getRandomValues(randomIndexArray);
    const randomIndex = randomIndexArray[0] % players.length;

    return players[randomIndex].id;
}

function makeTurnOrder(players: ReidsLobbyPlayer[]): number[] {
    const ids = players.map(p => p.id);

    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const j = array[0] % (i + 1);

        // Swap ids[i] and ids[j]
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    return ids;
}

async function chooseRandomWord(wordLists: number[]): Promise<LobbyWord> {
    if (wordLists.length === 0) throw new Error('wordlist cant be empty');

    // Select random LobbyWordList
    const listIndex = Math.floor(Math.random() * wordLists.length);
    const wordListIndex = wordLists[listIndex];

    const wordList = await getCachedWordList(wordListIndex);

    if (wordList.words.length === 0) throw new Error('words in wordlist cant be empty');

    // Select random LobbyWord from chosen list
    const wordIndex = Math.floor(Math.random() * wordList.words.length);
    return wordList.words[wordIndex];
}

async function getCachedWordList(id: number): Promise<LobbyWordList> {
    const wordListData = await getRedisSync(`wordlist-${ id }`);

    if (!wordListData) {
        const wordList = await cacheWordLists([id], true);
        if (!wordList) {
            throw new Error('Wordlist id not found');
        }
        return wordList[0];
    }

    const wordList: LobbyWordList = JSON.parse(wordListData);

    return wordList;
}

async function cacheWordLists(wordLists: number[], skipSearch: boolean = false): Promise<LobbyWordList[] | undefined> {
    const searchLists: number[] = [];

    if (!skipSearch) {
        const exists: number[] = [];

        for (const n of wordLists) {
            const data = await getRedisSync(`wordlist-${ n }`);
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
        setRedisSync(`wordlist-${ list.id }`, JSON.stringify(list), 2 * 24 * 60 * 60 * 1000);
    }

    return dbWordLists;
}
