import { createApiError, sendApiResponse } from '~~/server/utils/apiResponses';
import { makeFakeUserSession } from '~~/server/utils/auth';
import { checkNicknameAvailability, createFakeUser } from '~~/server/utils/backend/user';
import { joinSchema } from '~~/server/utils/backend/validation';

export default defineEventHandler(async event => {
    const body = await readBody(event);

    const validationResult = joinSchema.safeParse(body);
    if (!validationResult.success) {
        console.log(validationResult.error);
        throw createApiError('Invalid input', 400, validationResult.error.issues);
    }

    const { nickname } = validationResult.data;

    const nicknameCheck = await checkNicknameAvailability(nickname);
    if (!nicknameCheck.available) {
        switch (nicknameCheck.error) {
            case 'ALREADY_REGISTERED':
                return sendApiResponse(event, 'Nickname already chosen by a registered user', 400);
            default:
                return sendApiResponse(event, 'Nickname is not available', 400);
        }
    }

    const result = await createFakeUser(nickname);

    if (!result.success || !result.user) return sendApiResponse(event, 'Failed to create user', 500);

    await makeFakeUserSession(result.user, event);
    return { message: 'user created' };
});
