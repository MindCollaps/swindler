import { verifyJWT, generateJWT } from '~~/server/utils/crypto/jwt';
import { setAuthCookie, authCookieName } from '~~/server/utils/auth/cookie';
import { expireRedisSync } from '~~/server/utils/backend/redis';
import { userSessionAvailableMS } from '~~/server/utils/auth';

export default defineEventHandler(async event => {
    const token = getCookie(event, authCookieName);
    if (!token) {
        throw createError({ statusCode: 401, message: 'No token' });
    }

    let payload;
    try {
        payload = verifyJWT(token);
    }
    catch (ignore) {
        throw createError({ statusCode: 401, message: 'Invalid token' });
    }

    if (!payload || !payload.sub || typeof payload.random !== 'string') {
        throw createError({ statusCode: 401, message: 'Invalid token' });
    }

    const userId = parseInt(payload.sub, 10);
    const random = payload.random;
    const iat = Math.floor(Date.now() / 1000);

    await expireRedisSync(`user-${ random }`, userSessionAvailableMS);

    const newToken = generateJWT(userId, random, iat);

    setAuthCookie(event, newToken);

    return { status: 'refreshed' };
});
