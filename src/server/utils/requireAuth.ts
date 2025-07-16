import { verifyJWT } from './crypto/jwt';

export async function requireAuth(event: any) {
    const authHeader = getRequestHeader(event, 'authorization');

    if (!authHeader) {
        throw createApiError('Authorization header missing or invalid', 401);
    }

    const token = authHeader;

    try {
        const jwt = verifyJWT(token);
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

export async function requireJWT(event: any) {
    await requireAuth(event);
}

export async function requireAdminAuth(event: any) {
    await requireAuth(event);
    const user = event.context.user;

    if (!user.admin) {
        throw createApiError('Forbidden', 403);
    }
}
