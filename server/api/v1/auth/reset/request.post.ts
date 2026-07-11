import { checkRateLimit } from '~~/server/utils/backend/rateLimit';
import { passwordResetRequestSchema } from '~~/server/utils/backend/validation';
import { prisma } from '~~/server/utils/prisma';
import { createPasswordResetToken, passwordResetTokenTtlMinutes } from '~~/server/utils/auth/passwordReset';
import { buildPasswordResetUrl, sendTemplatedEmail } from '~~/server/utils/email';

export default defineEventHandler(async event => {
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown';

    const isAllowed = await checkRateLimit(`password-reset-request:${ clientIp }`, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 10,
    });

    if (!isAllowed) {
        throw createApiError('Too many reset attempts. Please try again later.', 429);
    }

    const body = await readBody(event);
    const validationResult = passwordResetRequestSchema.safeParse(body);

    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const { email } = validationResult.data;

    const user = await prisma.user.findFirst({
        where: {
            email,
        },
        select: {
            id: true,
            username: true,
            email: true,
            disabled: true,
        },
    });

    if (user && !user.disabled) {
        const token = await createPasswordResetToken(user.id);
        const resetUrl = buildPasswordResetUrl(token);

        await sendTemplatedEmail({
            to: user.email,
            subject: 'Reset your Swindler password',
            template: 'password-reset',
            context: {
                username: user.username,
                resetUrl,
                expiresInMinutes: passwordResetTokenTtlMinutes,
            },
        });
    }

    // Always return success to avoid exposing whether an email exists.
    return {
        message: 'If an account with that email exists, we sent a password reset link.',
    };
});
