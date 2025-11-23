import { lobbyCreationResponseSchema } from '~~/server/utils/validation';
import { createToken } from '~/utils/index';

export default defineEventHandler(async event => {
    await requireAuth(event);
    const body = await readBody(event);

    const validationResult = lobbyCreationResponseSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const token = createToken(8);

    const createdLobby = await prisma.lobby.create({
        data: {
            gameStarted: false,
            public: validationResult.data.public,
            round: validationResult.data.rounds,
            token: token,
            founded: new Date(),
            founder: {
                connect: {
                    id: event.context.user.id,
                },
            },
            gameRules: {
                create: {
                    allowSpecialGameMode: false,
                    timeLimit: validationResult.data.timeLimit,
                    timeLimited: validationResult.data.timeLimited,
                    membersCanAddCustomWordLists: validationResult.data.membersCanAddCustomWordLists,
                    membersCanAddWordLists: validationResult.data.membersCanAddWordLists,
                    maxPlayers: validationResult.data.maxPlayers,
                    maxRounds: validationResult.data.maxRounds,
                    rounds: validationResult.data.rounds,
                },
            },
        },
    });

    if (!createdLobby) {
        return createApiError('Failed to create lobby', 500);
    }

    return {
        redirect: `/lobby/${ token }`,
    };
});
