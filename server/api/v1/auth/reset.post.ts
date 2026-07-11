import { requireAuth, invalidateUserSession } from '~~/server/utils/auth';
import { prisma } from '~~/server/utils/prisma';
import { checkPassword, hashPassword } from '~~/server/utils/crypto/password';
import { passwordResetSchema } from '~~/server/utils/backend/validation';

export default defineEventHandler(async event => {
    await requireAuth(event);

    const authUser = event.context.user;
    if (!authUser) {
        throw createApiError('Unauthorized', 401);
    }

    const body = await readBody(event);
    const validationResult = passwordResetSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const { currentPassword, password, passwordRepeated } = validationResult.data;

    if (password !== passwordRepeated) {
        throw createApiError('Passwords do not match', 400);
    }

    const dbUser = await prisma.user.findUnique({
        where: {
            id: authUser.userId,
        },
        select: {
            id: true,
            password: true,
            disabled: true,
        },
    });

    if (!dbUser || dbUser.disabled) {
        throw createApiError('Unauthorized', 401);
    }

    const currentPasswordMatches = await checkPassword(currentPassword, dbUser.password);
    if (!currentPasswordMatches) {
        throw createApiError('Current password is incorrect', 400);
    }

    const newPasswordMatchesOld = await checkPassword(password, dbUser.password);
    if (newPasswordMatchesOld) {
        throw createApiError('New password must be different from current password', 400);
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
        where: {
            id: dbUser.id,
        },
        data: {
            password: hashedPassword,
        },
    });

    invalidateUserSession(event);

    return {
        message: 'Password updated. Please sign in again.',
    };
});
