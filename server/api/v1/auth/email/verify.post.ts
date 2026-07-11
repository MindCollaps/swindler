import { consumeEmailVerificationToken } from '~~/server/utils/auth/emailVerification';
import { emailVerifyTokenSchema } from '~~/server/utils/backend/validation';
import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async event => {
    const body = await readBody(event);
    const validationResult = emailVerifyTokenSchema.safeParse(body ?? {});
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const userId = await consumeEmailVerificationToken(validationResult.data.token);
    if (!userId) {
        throw createApiError('Invalid or expired verification token', 400);
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
        throw createApiError('Invalid or expired verification token', 400);
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
