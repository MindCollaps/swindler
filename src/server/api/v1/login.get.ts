import { checkUserSession } from '~/server/utils';

export default defineEventHandler(async event => {
    const session = await checkUserSession(event, false);
    if (session) {
        return createError({
            status: 400,
            message: 'already logged in',
        });
    }

    await setUserSession(event, {
        user: {
            logon: new Date(),
            userId: -1,
        },
    });
});
