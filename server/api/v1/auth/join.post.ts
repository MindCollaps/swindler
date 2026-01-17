import { createApiError, sendApiResponse } from '~~/server/utils/apiResponses';
import { makeFakeUserSession } from '~~/server/utils/auth';
import { createFakeUser } from '~~/server/utils/backend/user';
import { joinSchema } from '~~/server/utils/backend/validation';

export default defineEventHandler(async event => {
    const body = await readBody(event);

    const validationResult = joinSchema.safeParse(body);
    if (!validationResult.success) {
        console.log(validationResult.error);
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const { nickname, lobby } = validationResult.data;

    const result = await createFakeUser(nickname, lobby);

    if (!result.success || !result.user) return sendApiResponse(event, 'Failed to create user', 500);

    await makeFakeUserSession(result.user, event);
    return { message: 'user created' };
});
