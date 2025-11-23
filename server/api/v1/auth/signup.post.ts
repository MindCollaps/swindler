import { createApiError, sendApiResponse } from '~~/server/utils/apiResponses';

export default defineEventHandler(async event => {
    const body = await readBody(event);

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400);
    }

    const { username, password, passwordRepeated, email } = validationResult.data;

    if (password != passwordRepeated) {
        throw createApiError('Passwords do not match', 400);
    }

    const result = await createUser(username, email, password, false);
    if (!result.success) {
        switch (result.error) {
            case 'ALREADY_EXISTS':
                return sendApiResponse(event, 'User already exists', 400);
            case 'GENERAL_ERROR':
                return sendApiResponse(event, 'Internal server error', 500);
        }
    }

    return { success: true };
});
