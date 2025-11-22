import type { H3Event } from 'h3';
import type { UserSession } from '#auth-utils';

export async function checkUserSession(event: H3Event, errorOnFail: boolean = true): Promise<UserSession | null> {
    const session = await getUserSession(event);

    if (!session && errorOnFail) {
        createError({
            statusCode: 401,
            statusMessage: 'Not Loggedin',
        });
        return null;
    }

    return session;
}
