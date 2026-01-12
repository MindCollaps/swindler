import type { Namespace, Socket, DefaultEventsMap } from 'socket.io';
import { prisma } from '../utils/prisma';
import { LobbysWordListSelect } from '../../types/fetch';
import { getRedisSync, redisClient, setRedisSync } from '../utils/backend/redis';
import { createLock, IoredisAdapter } from 'redlock-universal';
import type { Lobby } from '../../types/redis';
import { createGame, gameLobbyTtl, giveClue, sendGame, sendVoted, vote, skipWait, voteForPlayer, nextGame, guessWord } from './game';
import { isSameUser } from '../../app/utils/user';
import { AVATAR_DEFINITIONS } from '../../types/data';
import type { Avatar } from '../../types/data';

export default async function lobbyHandler(namespace: Namespace, socket: Socket, id: string) {
    const userId = socket.user?.userId;
    const username = socket.user?.username;
    const fakeUser = socket.user?.fakeUser;

    if (!userId || !username || fakeUser == undefined) {
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

        const existingPlayerIndex = lobbyData.players.findIndex(e => isSameUser(e, { id: userId, fakeUser: fakeUser }));

        if (existingPlayerIndex !== -1) {
            // Update existing player
            const player = lobbyData.players[existingPlayerIndex];
            if (player) {
                player.connected = true;
                player.ready = false;
            }
        }
        else {
            if (lobbyData.gameRunning) {
                socket.emit('gameIsRunning');
                return;
            }
            // Add new player
            lobbyData.players.push({
                id: userId,
                username: username,
                ready: false,
                fakeUser: fakeUser,
                connected: true,
            });
        }

        setRedisSync(`lobby-${ id }`, JSON.stringify(lobbyData), gameLobbyTtl);
        await lock.release(handle);

        socket.emit('lobby', lobbyData);
        socket.broadcast.emit('players', lobbyData.players);
    }
    catch (e) {
        console.error('Failed to acquire lock for lobby update', e);
    }

    socket.on('start', () => lobbyStart(socket, id));
    socket.on('recreate', () => lobbyRecreate(socket, id));
    socket.on('addWord', value => addWordlist(socket, id, value));
    socket.on('removeWord', value => removeWordlist(socket, id, value));
    socket.on('giveClue', value => giveClue(socket, id, value, namespace));
    socket.on('vote', value => vote(socket, id, value, namespace));
    socket.on('skipWait', () => skipWait(socket, id, namespace));
    socket.on('voteForPlayer', value => voteForPlayer(socket, id, value, namespace));
    socket.on('nextGame', () => nextGame(socket, id, namespace));
    socket.on('ready', value => ready(socket, id, value));

    socket.on('guessWord', value => guessWord(socket, id, value, namespace));

    socket.on('game', () => sendGame(socket, id));

    sendVoted(socket, id);

    socket.on('disconnect', async () => {
        const cachedLobby = await getRedisSync(`lobby-${ id }`);
        if (!cachedLobby || !socket.user) return;
        const lobbyData: Lobby = JSON.parse(cachedLobby);

        if (lobbyData.gameRunning) {
            const player = lobbyData.players.find(e => isSameUser(e, { id: userId, fakeUser: fakeUser }));
            if (player) {
                player.connected = false;
            }
        }
        else {
            lobbyData.players = lobbyData.players.filter(e => !isSameUser(e, { id: userId, fakeUser: fakeUser }));
        }

        setRedisSync(`lobby-${ id }`, JSON.stringify(lobbyData), gameLobbyTtl);

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

async function ready(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: { avatar: Avatar; ready: boolean }) {
    const resource = `locks:lobby-${ id }`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    const handle = await lock.acquire();

    try {
        const lobbyData = await getRedisSync(`lobby-${ id }`) as string;

        if (!lobbyData || !socket.user) return;

        const lobby: Lobby = JSON.parse(lobbyData);

        if (lobby.gameRunning) return;

        if (!validateAvatar(value.avatar)) return;

        const player = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false }));

        if (!player) return;

        player.ready = value.ready;
        player.avatar = value.avatar;

        setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), gameLobbyTtl);
        socket.broadcast.emit('players', lobby.players);
    }
    finally {
        await lock.release(handle);
    }
}

async function lobbyStart(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const lobbyData = await getRedisSync(`lobby-${ id }`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (lobby.gameRunning) return;

    if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

    if (lobby.players.filter(x => x.ready).length != lobby.players.length) return;

    if (lobby.wordLists.length < 1) {
        socket.emit('errorMessage', 'You need to select at least one wordlist!');
        return;
    }

    lobby.gameStarted = true;
    lobby.gameRunning = true;
    setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), gameLobbyTtl);

    await createGame(lobby);

    socket.emit('start');
    socket.broadcast.emit('start');
}

async function lobbyRecreate(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const lobbyData = await getRedisSync(`lobby-${ id }`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (lobby.gameRunning || !lobby.gameStarted) return;

    if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

    lobby.gameStarted = false;
    lobby.wordLists = [];
    lobby.gameRules.games++;
    setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), gameLobbyTtl);

    socket.emit('lobby', lobbyData);
    socket.broadcast.emit('lobby', lobbyData);
}

async function addWordlist(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    const lobbyData = await getRedisSync(`lobby-${ id }`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (lobby.gameRunning) return;

    if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

    if (lobby.wordLists.indexOf(value) == -1) {
        lobby.wordLists.push(value);
        setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), gameLobbyTtl);

        socket.emit('lobbyWordLists', lobby.wordLists);
        socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
    }
}

async function removeWordlist(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    const lobbyData = await getRedisSync(`lobby-${ id }`);
    if (!lobbyData || !socket.user) return;
    const lobby: Lobby = JSON.parse(lobbyData);

    if (lobby.gameRunning) return;

    if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;
    if (lobby.wordLists.indexOf(value) != -1) {
        lobby.wordLists = lobby.wordLists.filter(x => x != value);
        setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), gameLobbyTtl);

        socket.emit('lobbyWordLists', lobby.wordLists);
        socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
    }
}

function isOwner(lobby: Lobby, user: { id: number; fakeUser: boolean }) {
    return isSameUser(lobby.founder, user);
}

function validateAvatar(avatar: any): boolean {
    if (!avatar || typeof avatar !== 'object') return false;

    // Check for unknown keys
    const allowedKeys = Object.keys(AVATAR_DEFINITIONS);
    const existingKeys = Object.keys(avatar);
    for (const key of existingKeys) {
        if (!allowedKeys.includes(key)) return false;
    }

    // Iterate over strict definitions
    // We cast to any to avoid complex typing for the iteration in this utility
    for (const [key, def] of Object.entries(AVATAR_DEFINITIONS)) {
        const value = avatar[key];
        const definition = def as { max: number; optional: boolean };

        if (!definition.optional && value === undefined) return false;

        if (value !== undefined) {
            if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > definition.max) {
                return false;
            }
        }
    }
    return true;
}
