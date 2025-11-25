import { makeUserSession } from '~~/server/utils/auth';
import { checkPassword } from '~~/server/utils/crypto/password';
import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async event => {
    const body = await readBody(event);

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const { username, password } = validationResult.data;

    try {
        const user = await prisma.user.findFirst({
            where: {
                username: username,
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
