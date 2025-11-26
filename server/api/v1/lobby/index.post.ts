import { lobbyCreationResponseSchema } from '~~/server/utils/backend/validation';
import { createToken } from '~~/server/utils/crypto';
import type { Lobby } from '~~/types/redis';

export default defineEventHandler(async event => {
    await requireAuth(event);
    const body = await readBody(event);

    const validationResult = lobbyCreationResponseSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const userId = event.context.user?.userId;
    const username = event.context.user?.username;

    if (!userId || !username) {
        throw createApiError('Invalid Token', 401, validationResult.error);
    }

    const token = createToken(8);

    const redisLobby: Lobby = {
        founded: new Date(),
        gameStarted: false,
        public: false,
        round: 0,
        token: token,
        founder: {
            id: userId,
            username
        },
        gameRules: {
            maxPlayers: 4,
            allowSpecialGameMode: false,
            maxRounds: 4,
            membersCanAddCustomWordLists: false,
            membersCanAddWordLists: false,
            rounds: 4,
            timeLimit: 0,
            timeLimited: false,
        },
        players: [],
    };

    setRedisSync(`lobby-${token}`, JSON.stringify(redisLobby), 5 * 60 * 60 * 1000);

    return {
        redirect: `/lobby/${token}`,
    };
});
