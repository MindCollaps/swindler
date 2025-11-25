import { invalidateUserSession } from '../utils/auth';

export default defineEventHandler(async event => {
    invalidateUserSession(event);
    sendRedirect(event, '/');
});
