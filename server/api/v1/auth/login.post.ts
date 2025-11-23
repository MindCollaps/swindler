import { generateJWT } from '~~/server/utils/crypto/jwt';
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

        const passwordCorrect = await checkPassword(password, user.password);
        if (passwordCorrect) {
            const jwt = generateJWT(user);
            setCookie(event, 'auth', jwt, { httpOnly: true, sameSite: 'strict', secure: true, expires: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)) });
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
