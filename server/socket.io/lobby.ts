import type { Namespace, Socket, DefaultEventsMap } from 'socket.io';
import { prisma } from '../utils/prisma';
import { LobbyFetchSelect, LobbysWordListSelect } from '../../types/fetch';
import { getRedisSync, redisClient, setRedisSync } from '../utils/backend/redis';
import { createLock, IoredisAdapter } from 'redlock-universal';
import type { RedisLobby } from '../../types/redis';

export default async function lobbyHandler(namespace: Namespace, socket: Socket, id: string) {
    const userId = socket.user?.userId;

    if (!userId) {
        console.log('No user id found!');
        return;
    }

    const resource = `locks:lobby-${ id }`;

    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });

    let lobbyData: RedisLobby;

    try {
        const handle = await lock.acquire();

        const cachedLobby = await getRedisSync(`lobby-${ id }`);

        if (!cachedLobby) {
            const lobby = await prisma.lobby.findUnique({
                where: {
                    token: id,
                },
                select: LobbyFetchSelect,
            });

            if (!lobby) {
                return;
            }

            const redisLobby: RedisLobby = {
                ...lobby,
                players: [],
            };

            lobbyData = redisLobby;
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

        namespace.emit('lobby', lobbyData);
    }
    catch (e) {
        console.error('Failed to acquire lock for lobby update', e);
    }

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

    socket.on('start', () => lobbyStart(socket, id));

    socket.on('disconnect', async () => {
        const cachedLobby = await getRedisSync(`lobby-${ id }`);
        if (!cachedLobby || !socket.user) return;
        const lobbyData: RedisLobby = JSON.parse(cachedLobby);

        lobbyData.players = lobbyData.players.filter(e => e.id != userId);
        setRedisSync(`lobby-${ id }`, JSON.stringify(lobbyData), 5 * 60 * 60 * 1000);

        namespace.emit('lobby', lobbyData);
    });

    socket.emit('wordLists', wordLists);
}

async function lobbyStart(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, id: string) {
    const cachedLobby = await getRedisSync(`lobby-${ id }`);
    if (!cachedLobby || !socket.user) return;
    const lobbyData: RedisLobby = JSON.parse(cachedLobby);

    if (!isOwner(lobbyData, socket.user.userId)) return;

    socket.emit('start');
    socket.broadcast.emit('start');
}

function isOwner(lobby: RedisLobby, userId: number) {
    return lobby.founder.id == userId;
}
