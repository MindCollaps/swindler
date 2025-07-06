import type { Lobby } from '~/types/backend/db';
import type { AsCreateDatabaseObject } from '~/types/backend/request';

const lobbies: AsCreateDatabaseObject<Lobby>[] = [];

export const serverData = {
    lobbies,
};
