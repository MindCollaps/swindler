import { sendApiDataResponse } from '~/server/utils/apiResponses';
import { generateJWT } from '~/server/utils/crypto/jwt';
import { checkPassword } from '~/server/utils/crypto/password';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async event => {
    const body = await readBody(event);

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.errors);
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
            return sendApiDataResponse(event, { success: true, jwt: jwt }, 200);
        }
        else {
            return sendApiResponse(event, 'Wrong username or password', 400);
        }
    }
    catch (error: any) {
        throw createApiError('Database error', 500, error);
    }
});
