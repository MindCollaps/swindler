import { createApiError, sendApiResponse } from '~~/server/utils/apiResponses';
import { makeUserSession } from '~~/server/utils/auth';
import { createUser } from '~~/server/utils/backend/user';
import { checkRateLimit } from '~~/server/utils/backend/rateLimit';

export default defineEventHandler(async event => {
    // Rate limiting: 3 signup attempts per hour per IP
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const isAllowed = await checkRateLimit(`signup:${ clientIp }`, {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
    });

    if (!isAllowed) {
        throw createApiError('Too many signup attempts. Please try again later.', 429);
    }

    const body = await readBody(event);

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const { username, password, passwordRepeated, email } = validationResult.data;

    if (password != passwordRepeated) {
        throw createApiError('Passwords do not match', 400);
    }

    const result = await createUser(username, email, password, false, false);
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
