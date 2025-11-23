// TODO: implement this

import { requireAuth } from '~~/server/utils/auth';

export default defineEventHandler(async event => {
    await requireAuth(event);

    const user = event.context.user;
    if (!user) {
        return createApiError('Unauthorized', 401);
    }

    return {
        secret: 'stuff',
        user: user.username,
    };
});
