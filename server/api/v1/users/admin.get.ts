export default defineEventHandler(async event => {
    await requireAdminAuth(event);

    const user = event.context.user;

    return {
        secret: 'stuff',
        user: user.username,
    };
});
