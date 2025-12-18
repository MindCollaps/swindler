import { lobbyCreationResponseSchema } from '~~/server/utils/backend/validation';
import { createToken } from '~~/server/utils/crypto';
import type { Lobby } from '~~/types/redis';
import { registerLobby } from '~~/server/socket.io/index';

export default defineEventHandler(async event => {
    await requireAuth(event);
    const body = await readBody(event);

    const validationResult = lobbyCreationResponseSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const userId = event.context.user?.userId;
    const username = event.context.user?.username;
    const fakeUser = event.context.user?.fakeUser;

    if (!userId || !username || fakeUser == undefined) {
        throw createApiError('Invalid Token', 401, validationResult.error);
    }

    const token = createToken(8);

    const redisLobby: Lobby = {
        founded: new Date(),
        gameStarted: false,
        gameRunning: false,
        public: false,
        round: 1,
        token: token,
        wordLists: [],
        gameEvents: [],
        playedGames: [],
        gameNumber: 1,
        founder: {
            id: userId,
            username,
            ready: false,
            fakeUser,
        },
        gameRules: {
            maxPlayers: 4,
            allowSpecialGameMode: false,
            games: 4,
            membersCanAddCustomWordLists: false,
            membersCanAddWordLists: false,
            rounds: 4,
            timeLimit: 0,
            timeLimited: false,
            revealVotes: false,
        },
        players: [],
    };

    setRedisSync(`lobby-${ token }`, JSON.stringify(redisLobby), 5 * 60 * 60 * 1000);
    registerLobby(token);

    return {
        redirect: `/lobby/${ token }`,
    };
});
