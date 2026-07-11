import { requireAuth } from '~~/server/utils/auth';
import { prisma } from '~~/server/utils/prisma';
import { emailVerifySchema } from '~~/server/utils/backend/validation';

export default defineEventHandler(async event => {
    await requireAuth(event);

    const authUser = event.context.user;
    if (!authUser) {
        throw createApiError('Unauthorized', 401);
    }

    const body = await readBody(event);
    const validationResult = emailVerifySchema.safeParse(body ?? {});
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const requestedEmail = validationResult.data.email;

    const dbUser = await prisma.user.findUnique({
        where: {
            id: authUser.userId,
        },
        select: {
            id: true,
            email: true,
            emailVerified: true,
            disabled: true,
        },
    });

    if (!dbUser || dbUser.disabled) {
        throw createApiError('Unauthorized', 401);
    }

    if (requestedEmail && requestedEmail !== dbUser.email) {
        throw createApiError('Email mismatch', 400);
    }

    if (dbUser.emailVerified) {
        return {
            verified: true,
            message: 'Email is already verified.',
        };
    }

    await prisma.user.update({
        where: {
            id: dbUser.id,
        },
        data: {
            emailVerified: true,
        },
    });

    return {
        verified: true,
        message: 'Email verified.',
    };
});
