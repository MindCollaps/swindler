import { verifyJWT } from './crypto/jwt';

export async function requireAuth(event: any) {
    const authCookie = getCookie(event, 'auth');

    if (!authCookie) {
        throw createApiError('Authorization cookie missing or invalid', 401);
    }

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

        event.context.user = {
            id: parseInt(jwt.userId),
            username: jwt.username,
            admin: jwt.admin,
        };

        return true;
    }
    catch (error: any) {
        throw createApiError('Invalid or expired token', 401, error);
    }
}

export async function requireAdminAuth(event: any) {
    await requireAuth(event);
    const userId = event.context.user.id;

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
