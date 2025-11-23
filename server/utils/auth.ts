import type { H3EventContext, H3Event } from 'h3';
import { verifyJWT } from './crypto/jwt';
import type { Socket, DefaultEventsMap } from 'socket.io';

declare module 'h3' {
    interface H3EventContext {
        user?: {
            id: number;
            username: string;
            admin: boolean;
        };
    }
}

async function checkJwt(authCookie: string): Promise<H3EventContext['user'] | undefined> {
    try {
        const jwt = verifyJWT(authCookie);
        if (!jwt) {
            throw createApiError('Forbidden', 403);
        }

        const userId = parseInt(jwt.userId);

        // check if the user still exists
        const existingUser = await prisma.user.findFirst({
            where: {
                AND: [
                    { id: userId },
                    { username: jwt.username },
                ],
            },
        });

        if (!existingUser) {
            throw createApiError('Invalid or expired token', 401);
        }

        return {
            id: parseInt(jwt.userId),
            username: jwt.username,
            admin: existingUser.admin, // fetch this from the database!!
        };
    }
    catch (error: any) {
        throw createApiError('Invalid or expired token', 401, error);
    }
}

export async function requireAuth(event: H3Event) {
    const authCookie = getCookie(event, 'auth');

    if (!authCookie) {
        throw createApiError('Authorization cookie missing or invalid', 401);
    }

    try {
        const user = await checkJwt(authCookie);
        event.context.user = user;
    }
    catch {
        return;
    }
}

export async function parseSocketCookie(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>): Promise<H3EventContext['user'] | undefined> {
    const authCookie = socket.request.headers.cookie;

    if (!authCookie) {
        // No cookie, reject connection
        throw new Error('Authentication cookie missing');
    }

    // Parse your JWT token from cookie string (you may want to parse cookies properly)
    const tokenMatch = authCookie.match(/auth=([^;]+)/);
    if (!tokenMatch) {
        throw new Error('Auth token missing in cookie');
    }

    const token = tokenMatch[1];

    if (!token) {
        throw new Error('Auth token missing in cookie');
    }

    const user = await checkJwt(token);
    return user;
}

export async function requireAdminAuth(event: H3Event) {
    await requireAuth(event);
    const userId = event.context.user?.id;

    if (!userId) {
        throw createApiError('Invalid or expired token', 401);
    }

    const user = await prisma.user.findFirst({
        where: { id: userId },
    });

    if (!user) {
        throw createApiError('Invalid or expired token', 401);
    }

    if (!user.admin) {
        throw createApiError('Forbidden', 403);
    }
}
