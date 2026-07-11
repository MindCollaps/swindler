import { passwordResetConfirmSchema } from '~~/server/utils/backend/validation';
import { prisma } from '~~/server/utils/prisma';
import { checkPassword, hashPassword } from '~~/server/utils/crypto/password';
import { consumePasswordResetToken } from '~~/server/utils/auth/passwordReset';
import { sendTemplatedEmail } from '~~/server/utils/email';

export default defineEventHandler(async event => {
    const body = await readBody(event);
    const validationResult = passwordResetConfirmSchema.safeParse(body);

    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const { token, password, passwordRepeated } = validationResult.data;

    if (password !== passwordRepeated) {
        throw createApiError('Passwords do not match', 400);
    }

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
        throw createApiError('Invalid or expired reset token', 400);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            username: true,
            email: true,
            password: true,
            disabled: true,
        },
    });

    if (!user || user.disabled) {
        throw createApiError('Invalid or expired reset token', 400);
    }

    const newPasswordMatchesOld = await checkPassword(password, user.password);
    if (newPasswordMatchesOld) {
        throw createApiError('New password must be different from current password', 400);
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            password: hashedPassword,
        },
    });

    await sendTemplatedEmail({
        to: user.email,
        subject: 'Your Swindler password was changed',
        template: 'password-reset-success',
        context: {
            username: user.username,
        },
    });

    return {
        message: 'Password updated successfully.',
    };
});
