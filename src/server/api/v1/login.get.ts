export default defineEventHandler(async event => {
    const session = await getUserSession(event);
    if (session && session.user && session.user.userId !== undefined) {
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

    return 'ok';
});
