import { checkRateLimit } from '~~/server/utils/backend/rateLimit';
import { emailResendSchema } from '~~/server/utils/backend/validation';
import { prisma } from '~~/server/utils/prisma';
import { createEmailVerificationToken, emailVerificationTokenTtlHours } from '~~/server/utils/auth/emailVerification';
import { buildEmailVerificationUrl, sendTemplatedEmail } from '~~/server/utils/email';

export default defineEventHandler(async event => {
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown';

    const isAllowed = await checkRateLimit(`email-resend:${ clientIp }`, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 10,
    });

    if (!isAllowed) {
        throw createApiError('Too many resend attempts. Please try again later.', 429);
    }

    const body = await readBody(event);
    const validationResult = emailResendSchema.safeParse(body);

    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const { username } = validationResult.data;

    const user = await prisma.user.findFirst({
        where: {
            username,
            disabled: false,
        },
        select: {
            id: true,
            username: true,
            email: true,
            emailVerified: true,
        },
    });

    if (user && !user.emailVerified) {
        const token = await createEmailVerificationToken(user.id);
        const verificationUrl = buildEmailVerificationUrl(token);

        await sendTemplatedEmail({
            to: user.email,
            subject: 'Verify your Swindler email',
            template: 'account-created',
            context: {
                username: user.username,
                verificationUrl,
                expiresInHours: emailVerificationTokenTtlHours,
            },
        });
    }

    // Keep response generic to avoid account/email verification enumeration.
    return {
        message: 'If the account exists and is unverified, we sent a verification email.',
    };
});
