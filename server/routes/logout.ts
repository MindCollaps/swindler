import { invalidateUserSession } from '../utils/auth';

export default defineEventHandler(async event => {
    const query = getQuery(event);
    let redirect = typeof query.redirect === 'string' ? query.redirect : '/';

    // Validate redirect to prevent open redirects
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
        redirect = '/';
    }

    invalidateUserSession(event);
    sendRedirect(event, redirect);
});
