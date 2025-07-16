import { hashPassword } from '~/server/utils/crypto/password';
import { createApiError, sendApiResponse } from '~/server/utils/apiResponses';

export default defineEventHandler(async event => {
    const body = await readBody(event);

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error.errors);
    }

    const { username, password, passwordRepeated, email } = validationResult.data;

    if (password != passwordRepeated) {
        throw createApiError('Passwords do not match', 400);
    }

    try {
    // check if the username or mail already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email },
                ],
            },
        });

        if (existingUser) {
            return sendApiResponse(event, 'User already exists', 400);
        }

        const hashedPW = await hashPassword(password);
        if (!hashedPW) {
            return sendApiResponse(event, 'Internal server error');
        }

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPW,
                email,
            },
        });

        if (!newUser) {
            return sendApiResponse(event, 'Database error', 500);
        }

        return { success: true };
    }
    catch (error: any) {
        throw createApiError('Database error', 500, error);
    }
});
