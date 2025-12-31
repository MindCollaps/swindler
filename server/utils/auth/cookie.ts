import type { H3Event, EventHandlerRequest } from 'h3';
import { userSessionAvailableMS } from '.';

export const authCookieName = 'auth';

export function setAuthCookie(event: H3Event<EventHandlerRequest>, jwt: string) {
    setCookie(event, authCookieName, jwt, { httpOnly: true, sameSite: 'strict', secure: true, expires: new Date(Date.now() + (userSessionAvailableMS)) });
}

export function removeAuthCookie(event: H3Event<EventHandlerRequest>) {
    deleteCookie(event, authCookieName);
}
