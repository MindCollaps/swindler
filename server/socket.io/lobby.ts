import type { Namespace, Socket, DefaultEventsMap } from 'socket.io';
import { prisma } from '../utils/prisma';
import { LobbysWordListSelect } from '../../types/fetch';
import { createGame, giveClue, sendGame, sendVoted, vote, skipWait, voteForPlayer, nextGame, guessWord, returnToLobby } from './game';
import { isOwner, withLock, getLobby, saveLobby } from '../utils/game/helper';
import { isSameUser } from '../../app/utils/user';
import { AVATAR_DEFINITIONS } from '../../types/data';
import type { Avatar } from '../../types/data';

export default async function lobbyHandler(namespace: Namespace, socket: Socket, id: string) {
    const userId = socket.user?.userId;
    const username = socket.user?.username;
    const fakeUser = socket.user?.fakeUser;

    let abortConnection = false;

    if (!userId || !username || fakeUser == undefined) {
        console.log('No user id found!');
        return;
    }

    await withLock(id, 'lobby', async () => {
        const lobbyData = await getLobby(id);

        if (!lobbyData) {
            socket.emit('redirect', '/lobby');
            return;
        }

        const existingPlayerIndex = lobbyData.players.findIndex(e => isSameUser(e, { id: userId, fakeUser: fakeUser }));

        if (existingPlayerIndex !== -1) {
            // Update existing player
            const player = lobbyData.players[existingPlayerIndex];
            if (player) {
                player.connected = true;
                player.ready = lobbyData.gameRunning; // Ready wont be reset if the game is running (game is running = false | wont be set to false(reset))
            }
        }
        else {
            if (lobbyData.gameRunning) {
                socket.emit('gameIsRunning');
                abortConnection = true;
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

        await saveLobby(id, lobbyData);

        socket.emit('lobby', lobbyData);
        socket.broadcast.emit('players', lobbyData.players);
    });

    socket.on('game', () => sendGame(socket, id));

    if (abortConnection) {
        return;
    }

    socket.on('start', () => lobbyStart(socket, id));
    socket.on('continue', () => lobbyContinue(socket, id));
    socket.on('addWord', value => addWordlist(socket, id, value));
    socket.on('removeWord', value => removeWordlist(socket, id, value));
    socket.on('giveClue', value => giveClue(socket, id, value, namespace));
    socket.on('vote', value => vote(socket, id, value, namespace));
    socket.on('skipWait', () => skipWait(socket, id, namespace));
    socket.on('voteForPlayer', value => voteForPlayer(socket, id, value, namespace));
    socket.on('nextGame', () => nextGame(socket, id, namespace));
    socket.on('ready', value => ready(socket, id, value));
    socket.on('returnToLobby', () => returnToLobby(socket, id));

    socket.on('guessWord', value => guessWord(socket, id, value, namespace));

    sendVoted(socket, id);

    socket.on('disconnect', async () => {
        await withLock(id, 'lobby', async () => {
            const lobbyData = await getLobby(id);
            if (!lobbyData || !socket.user) return;

            if (lobbyData.gameRunning) {
                const player = lobbyData.players.find(e => isSameUser(e, { id: userId, fakeUser: fakeUser }));
                if (player) {
                    player.connected = false;
                }
            }
            else {
                lobbyData.players = lobbyData.players.filter(e => !isSameUser(e, { id: userId, fakeUser: fakeUser }));
            }

            await saveLobby(id, lobbyData);

            namespace.emit('players', lobbyData.players);
        });
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
    await withLock(id, 'lobby', async () => {
        const lobby = await getLobby(id);

        if (!lobby || !socket.user) return;

        if (lobby.gameRunning) return;

        if (!validateAvatar(value.avatar)) return;

        const player = lobby.players.find(x => isSameUser(x, { id: socket.user?.userId ?? 0, fakeUser: socket.user?.fakeUser ?? false }));

        if (!player) return;

        player.ready = value.ready;
        player.avatar = value.avatar;

        await saveLobby(id, lobby);
        socket.broadcast.emit('players', lobby.players);
    });
}

async function lobbyStart(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    await withLock(id, 'lobby', async () => {
        const lobby = await getLobby(id);
        if (!lobby || !socket.user) return;

        if (lobby.gameRunning) return;

        if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

        if (lobby.players.filter(x => x.ready).length != lobby.players.length) {
            socket.emit('errorMessage', 'Not all players are ready!');
            return;
        }

        if (lobby.wordLists.length < 1) {
            socket.emit('errorMessage', 'You need to select at least one wordlist!');
            return;
        }

        lobby.gameStarted = true;
        lobby.gameRunning = true;
        await saveLobby(id, lobby);

        await createGame(lobby);

        socket.emit('start');
        socket.broadcast.emit('start');
    });
}

async function lobbyContinue(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    await withLock(id, 'lobby', async () => {
        const lobby = await getLobby(id);
        if (!lobby || !socket.user) return;

        if (lobby.gameRunning || !lobby.gameStarted) return;

        if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

        lobby.gameRunning = true;
        lobby.gameNumber += 1;
        lobby.round = 1;
        await saveLobby(id, lobby);

        await createGame(lobby);

        socket.emit('start');
        socket.broadcast.emit('start');
    });
}

async function addWordlist(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    await withLock(id, 'lobby', async () => {
        const lobby = await getLobby(id);
        if (!lobby || !socket.user) return;

        if (lobby.gameRunning) return;

        if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;

        if (lobby.wordLists.indexOf(value) == -1) {
            lobby.wordLists.push(value);
            await saveLobby(id, lobby);

            socket.emit('lobbyWordLists', lobby.wordLists);
            socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
        }
    });
}

async function removeWordlist(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string, value: any) {
    await withLock(id, 'lobby', async () => {
        const lobby = await getLobby(id);
        if (!lobby || !socket.user) return;

        if (lobby.gameRunning) return;

        if (!isOwner(lobby, { id: socket.user.userId, fakeUser: socket.user.fakeUser })) return;
        if (lobby.wordLists.indexOf(value) != -1) {
            lobby.wordLists = lobby.wordLists.filter(x => x != value);
            await saveLobby(id, lobby);

            socket.emit('lobbyWordLists', lobby.wordLists);
            socket.broadcast.emit('lobbyWordLists', lobby.wordLists);
        }
    });
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
