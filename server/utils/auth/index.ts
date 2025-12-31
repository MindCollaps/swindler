import type { H3EventContext, H3Event, EventHandlerRequest } from 'h3';
import { verifyJWT } from '../crypto/jwt';
import type { Socket, DefaultEventsMap } from 'socket.io';
import { setAuthCookie, removeAuthCookie, authCookieName } from '~~/server/utils/auth/cookie';
import type { User } from '@prisma/client';
import { createToken } from '../crypto';
import type { UserSession } from '~~/types/data';
import { getRedisSync } from '~~/server/utils/backend/redis';
import cookie from 'cookie';
import type { FakeUser } from '~~/types/redis';

export const userSessionAvailableMS = 5 * 24 * 60 * 60 * 1000;

declare module 'h3' {
    interface H3EventContext {
        user?: UserSession & { random: string };
    }
}

export async function makeUserSession(user: User, event: H3Event<EventHandlerRequest>) {
    await makeSession(user.admin, user.username, user.id, event, false, user.developer);
}

export async function makeFakeUserSession(fakeUser: FakeUser, event: H3Event<EventHandlerRequest>) {
    await makeSession(false, fakeUser.nickname, fakeUser.id, event, true, false);
}

async function makeSession(admin: boolean, username: string, userId: number, event: H3Event<EventHandlerRequest>, fakeUser: boolean, developer: boolean = false) {
    let random = createToken(8);
    let found = await getRedisSync(`user-${ random }`);

    while (found) {
        random = createToken(8);
        found = await getRedisSync(`user-${ random }`);
    }

    const iat = Math.floor(Date.now() / 1000);
    const jwt = generateJWT(userId, random, iat);

    const data: UserSession = {
        admin,
        username,
        userId,
        timeStamp: iat,
        fakeUser: fakeUser,
        developer,
    };

    await setRedisSync(`user-${ random }`, JSON.stringify(data), userSessionAvailableMS);
    setAuthCookie(event, jwt);
}

export function invalidateUserSession(event: H3Event<EventHandlerRequest>) {
    removeAuthCookie(event);
    if (event.context.user?.userId) {
        unsetRedisSync(`user-${ event.context.user.random }`);
    }
}

async function checkJwt(authCookie: string): Promise<H3EventContext['user'] | undefined> {
    try {
        const jwt = verifyJWT(authCookie);
        if (!jwt) {
            throw new Error('Forbidden');
        }

        // check if the user still exists
        const userSession = await getRedisSync(`user-${ jwt.random }`);
        if (!userSession) {
            throw new Error('Invalid or expired token');
        }

        const user: UserSession | null = userSession ? JSON.parse(userSession) : null;

        if (!user) {
            throw new Error('Invalid or expired token');
        }

        if (user.timeStamp != jwt.iat) {
            throw new Error('Invalid or expired token');
        }

        return {
            userId: user.userId,
            username: user.username,
            admin: user.admin,
            random: jwt.random,
            timeStamp: jwt.iat ?? 0,
            fakeUser: user.fakeUser,
            developer: user.developer ?? false,
        };
    }
    catch (error: any) {
        throw createApiError('Invalid or expired token', 401, error);
    }
}

export async function requireAuth(event: H3Event) {
    const authCookie = getCookie(event, authCookieName);

    if (!authCookie) {
        throw createApiError('Authorization cookie missing or invalid', 401);
    }

    try {
        const user = await checkJwt(authCookie);
        if (!user) {
            throw new Error('User invalid!');
        }
        else if (user.fakeUser) {
            throw new Error('Fake user not authorized for this resource!');
        }
        else {
            event.context.user = user;
        }
    }
    catch (err) {
        invalidateUserSession(event);
        // Log error for debugging but don't expose details to client
        if (import.meta.dev) {
            console.error('Auth error:', err);
        }
        throw createApiError('Invalid or expired token', 401);
    }
}

export async function parseSocketCookie(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>): Promise<H3EventContext['user'] | undefined> {
    const cookies = socket.handshake.headers.cookie;
    const parsedCookies = cookies ? cookie.parse(cookies) : {};

    const token = parsedCookies[authCookieName];

    if (!token) {
        throw new Error('Auth token missing in cookie');
    }

    try {
        const user = await checkJwt(token);
        return user;
    }
    catch {
        // invalid token
        return undefined;
    }
}

export async function requireAdminAuth(event: H3Event) {
    await requireAuth(event);
    const admin = event.context.user?.admin;

    if (!admin) {
        throw createApiError('Forbidden', 403);
    }
}
