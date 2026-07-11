import { consumeEmailVerificationToken } from '~~/server/utils/auth/emailVerification';
import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async event => {
    const query = getQuery(event);
    const rawToken = query.token;
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    if (!token || typeof token !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid verification token',
        });
    }

    const userId = await consumeEmailVerificationToken(token);
    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid or expired verification token',
        });
    }

    const dbUser = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            emailVerified: true,
            disabled: true,
        },
    });

    if (!dbUser || dbUser.disabled) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid or expired verification token',
        });
    }

    if (!dbUser.emailVerified) {
        await prisma.user.update({
            where: {
                id: dbUser.id,
            },
            data: {
                emailVerified: true,
            },
        });
    }

    return sendRedirect(event, '/login?emailVerified=1');
});
