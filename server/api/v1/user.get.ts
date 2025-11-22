import { checkUserSession } from '~~/server/utils';

export default defineEventHandler(async event => {
    const session = await checkUserSession(event);
    if (!session) return;


    return 'ok';
});
