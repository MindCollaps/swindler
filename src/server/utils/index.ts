import type { H3Event } from 'h3';
import type { UserSession, UserSessionRequired } from '#auth-utils';

export async function checkUserSession(event: H3Event, errorOnFail: boolean = true): Promise<UserSession | undefined> {
    const session = await getUserSession(event);

    if (!session && errorOnFail) {
        createError({
            statusCode: 401,
            statusMessage: 'Not Loggedin',
        });
        return undefined;
    }

    return session;
}

