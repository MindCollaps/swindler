import { getRedisSync, redisClient, setRedisSync } from '../backend/redis';
import { createLock, IoredisAdapter } from 'redlock-universal';
import type { Lobby, Game } from '../../../types/redis';
import { isSameUser } from '../../../app/utils/user';

export const waitForNextRound = 20 * 1000;
export const waitForNewRound = 5 * 1000;
export const gameLobbyTtl = 5 * 60 * 60 * 1000;

export const lobbyTimeouts = new Map<string, NodeJS.Timeout>();

export async function getGame(id: string) {
    const data = await getRedisSync(`game-${ id }`) as string;
    return data ? JSON.parse(data) as Game : undefined;
}

export async function getLobby(id: string) {
    const data = await getRedisSync(`lobby-${ id }`) as string;
    return data ? JSON.parse(data) as Lobby : undefined;
}

export async function getGameAndLobby(id: string) {
    const [gameData, lobbyData] = await Promise.all([
        getRedisSync(`game-${ id }`) as Promise<string>,
        getRedisSync(`lobby-${ id }`) as Promise<string>,
    ]);
    return {
        game: gameData ? JSON.parse(gameData) as Game : undefined,
        lobby: lobbyData ? JSON.parse(lobbyData) as Lobby : undefined,
    };
}

export async function saveGame(id: string, game: Game) {
    await setRedisSync(`game-${ id }`, JSON.stringify(game), gameLobbyTtl);
}

export async function saveLobby(id: string, lobby: Lobby) {
    await setRedisSync(`lobby-${ id }`, JSON.stringify(lobby), gameLobbyTtl);
}

export async function withLock<T>(id: string, type: 'game' | 'lobby', fn: () => Promise<T>) {
    const resource = `locks:${ type }-${ id }`;
    const lock = createLock({
        adapter: new IoredisAdapter(redisClient),
        key: resource,
        ttl: 20000,
    });
    const handle = await lock.acquire();
    try {
        return await fn();
    }
    finally {
        await lock.release(handle);
    }
}

export function isOwner(lobby: Lobby, user: { id: number; fakeUser: boolean }) {
    return isSameUser(lobby.founder, user);
}
