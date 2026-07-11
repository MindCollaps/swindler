import { requireAuth } from '~~/server/utils/auth';
import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async event => {
    await requireAuth(event);

    const user = event.context.user;
    if (!user) {
        throw createApiError('Unauthorized', 401);
    }

    const dbUser = await prisma.user.findUnique({
        where: {
            id: user.userId,
        },
        select: {
            id: true,
            username: true,
            email: true,
            emailVerified: true,
            admin: true,
            disabled: true,
            developer: true,
            xp: true,
            level: true,
            gamesPlayed: true,
        },
    });

    if (!dbUser || dbUser.disabled) {
        throw createApiError('Unauthorized', 401);
    }

    return {
        user: dbUser,
    };
});
