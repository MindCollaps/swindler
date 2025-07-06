import { checkUserSession } from '~/server/utils';
import type { Lobby } from '~/types/backend/db';
import type { AsCreateDatabaseObject } from '~/types/backend/request';
import { devGameRules } from '~/types/dev';
import type { LobbyData } from '~/types/game';
import { serverData } from '~/utils/data';
import { createToken } from '~/utils';
import { convertLobby } from '~/server/utils/convert';


export default defineEventHandler(async event => {
    const session = await checkUserSession(event);
    if (!session) return;

    const token = createToken();

    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized!',
        });
    }

    const lobby: AsCreateDatabaseObject<Lobby> = {
        founder: session.user.userId,
        founded: new Date(),
        gameEvents: [],
        gameRules: devGameRules,
        gameStarted: false,
        players: [],
        public: false,
        round: 0,
        wordLists: [],
        token,
    };

    serverData.lobbies.push(lobby);

    const lobbyData: LobbyData = convertLobby(lobby);

    return lobbyData as LobbyData;
});
