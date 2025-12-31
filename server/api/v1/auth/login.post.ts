import { makeUserSession } from '~~/server/utils/auth';
import { checkPassword } from '~~/server/utils/crypto/password';
import { prisma } from '~~/server/utils/prisma';
import { checkRateLimit } from '~~/server/utils/backend/rateLimit';

export default defineEventHandler(async event => {
    // Rate limiting: 5 login attempts per 15 minutes per IP
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    console.log(`[Auth:Login] Login attempt from IP: ${ clientIp }`);

    const isAllowed = await checkRateLimit(`login:${ clientIp }`, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
    });

    if (!isAllowed) {
        console.warn(`[Auth:Login] Rate limit exceeded for IP: ${ clientIp }`);
        throw createApiError('Too many login attempts. Please try again later.', 429);
    }

    const body = await readBody(event);

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
        console.warn(`[Auth:Login] Invalid input from IP: ${ clientIp }`, validationResult.error.issues);
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const { username, password } = validationResult.data;
    console.log(`[Auth:Login] Login attempt for user: ${ username } from IP: ${ clientIp }`);

    try {
        const user = await prisma.user.findFirst({
            where: {
                username: username.toLowerCase(), // always use the lowercase username!!
            },
        });

        if (!user) {
            console.warn(`[Auth:Login] Failed login attempt - user not found: ${ username } from IP: ${ clientIp }`);
            return sendApiResponse(event, 'Wrong username or password', 400);
        }

        if (user.disabled) {
            console.warn(`[Auth:Login] Failed login attempt - disabled account: ${ username } from IP: ${ clientIp }`);
            return sendApiResponse(event, 'Wrong username or password', 400);
        }

        const passwordCorrect = await checkPassword(password, user.password);
        if (passwordCorrect) {
            console.log(`[Auth:Login] Successful login for user: ${ username } (ID: ${ user.id }) from IP: ${ clientIp }`);
            await makeUserSession(user, event);
            return { redirect: '/dashboard' };
        }
        else {
            console.warn(`[Auth:Login] Failed login attempt - incorrect password for user: ${ username } from IP: ${ clientIp }`);
            return sendApiResponse(event, 'Wrong username or password', 400);
        }
    }
    catch (error: any) {
        console.error(`[Auth:Login] Database error during login for user: ${ username } from IP: ${ clientIp }`, error);
        throw createApiError('Database error', 500, error);
    }
});
