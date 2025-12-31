import { invalidateUserSession } from '../utils/auth';

export default defineEventHandler(async event => {
    const query = getQuery(event);
    const redirect = typeof query.redirect === 'string' ? query.redirect : '/';
    invalidateUserSession(event);
    sendRedirect(event, redirect);
});
