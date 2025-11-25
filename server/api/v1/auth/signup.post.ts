import { createApiError, sendApiResponse } from '~~/server/utils/apiResponses';
import { makeUserSession } from '~~/server/utils/auth';

export default defineEventHandler(async event => {
    const body = await readBody(event);

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const { username, password, passwordRepeated, email } = validationResult.data;

    if (password != passwordRepeated) {
        throw createApiError('Passwords do not match', 400);
    }

    const result = await createUser(username, email, password, false);
    if (!result.success || !result.user) {
        switch (result.error) {
            case 'ALREADY_EXISTS':
                return sendApiResponse(event, 'User already exists', 400);
            case 'DATABASE_ERROR':
                return sendApiResponse(event, 'Internal server error', 500);
            default:
                return sendApiResponse(event, 'Unknown error', 500);
        }
    }

    await makeUserSession(result.user, event);
    return { message: 'account created!', redirect: '/dashboard' };
});
