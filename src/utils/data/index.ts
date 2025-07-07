import type { Game, Lobby, User } from '~/types/backend/db';

const lobbies: Lobby[] = [];
const games: Game[] = [];
const users: User[] = [];

export const serverData = {
    lobbies,
    games,
    users,
};
