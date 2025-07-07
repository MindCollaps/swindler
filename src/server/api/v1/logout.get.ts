export default defineEventHandler(async event => {
    clearUserSession(event);
    return 'ok';
});
