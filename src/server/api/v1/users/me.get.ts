// TODO: implement this
// TODO: protect this endpoint with an auth middleware

import { requireJWT } from '~/server/utils/requireAuth';

export default defineEventHandler(async event => {
    await requireJWT(event);
    const user = event.context.user;

    return {
        secret: 'stuff',
        user: user.username,
    };
});
