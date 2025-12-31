import { makeUserSession } from '~~/server/utils/auth';
import { checkPassword } from '~~/server/utils/crypto/password';
import { prisma } from '~~/server/utils/prisma';
import { checkRateLimit } from '~~/server/utils/backend/rateLimit';

export default defineEventHandler(async event => {
    // Rate limiting: 5 login attempts per 15 minutes per IP
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const isAllowed = await checkRateLimit(`login:${ clientIp }`, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
    });

    if (!isAllowed) {
        throw createApiError('Too many login attempts. Please try again later.', 429);
    }

    const body = await readBody(event);

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const { username, password } = validationResult.data;

    try {
        const user = await prisma.user.findFirst({
            where: {
                username: username.toLowerCase(), // always use the lowercase username!!
            },
        });

        if (!user) {
            return sendApiResponse(event, 'Wrong username or password', 400);
        }

        if (user.disabled) {
            return sendApiResponse(event, 'Wrong username or password', 400);
        }

        const passwordCorrect = await checkPassword(password, user.password);
        if (passwordCorrect) {
            await makeUserSession(user, event);
            return { redirect: '/dashboard' };
        }
        else {
            return sendApiResponse(event, 'Wrong username or password', 400);
        }
    }
    catch (error: any) {
        throw createApiError('Database error', 500, error);
    }
});
