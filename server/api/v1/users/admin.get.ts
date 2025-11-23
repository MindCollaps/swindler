export default defineEventHandler(async event => {
    await requireAdminAuth(event);

    const user = event.context.user;
    if (!user) {
        return createApiError('Unauthorized', 401);
    }

    return {
        secret: 'stuff',
        user: user.username,
    };
});
