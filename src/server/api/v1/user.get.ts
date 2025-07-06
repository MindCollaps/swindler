import { checkUserSession } from '~/server/utils';

export default defineEventHandler(async event => {
    const session = await checkUserSession(event);
    if (!session) return;


    await setUserSession(event, {
        user: {
            logon: new Date(),
            userId: -1,
        },
    });
});
