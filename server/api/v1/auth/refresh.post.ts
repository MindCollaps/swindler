import { verifyJWT, generateJWT } from '~~/server/utils/crypto/jwt';
import { setAuthCookie, authCookieName } from '~~/server/utils/auth/cookie';
import { getRedisSync, setRedisSync } from '~~/server/utils/backend/redis';
import { userSessionAvailableMS } from '~~/server/utils/auth';
import type { UserSession } from '~~/types/data';
import { socketServer } from '~~/server/plugins/socket.io.server';

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

    // Get existing session to preserve user data
    const existingSessionStr = await getRedisSync(`user-${ random }`);
    if (!existingSessionStr) {
        throw createError({ statusCode: 401, message: 'Session expired' });
    }

    const userSession: UserSession = JSON.parse(existingSessionStr);

    // Update timestamp in session data
    userSession.timeStamp = iat;

    await setRedisSync(`user-${ random }`, JSON.stringify(userSession), userSessionAvailableMS);

    // Update active sockets for this user to match the new timestamp
    if (socketServer) {
        const sockets = await socketServer.fetchSockets();
        for (const socket of sockets) {
            // @ts-expect-error raw socket type vs remote socket
            if (socket.user?.userId === userId && socket.user?.random === random) {
                // @ts-expect-error user property is writable on the socket instance
                socket.user.timeStamp = iat;
            }
        }
    }

    const newToken = generateJWT(userId, random, iat);

    setAuthCookie(event, newToken);

    return { status: 'refreshed' };
});
