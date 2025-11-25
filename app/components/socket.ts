import { io } from 'socket.io-client';
import { useStore } from '~/store';
import type { MeUserObject } from '~~/types/socket';

export const socket = io('/', { path: '/socket.io' });
let initalized = false;

export function setupSocket() {
    if (initalized) return;
    initalized = true;

    socket.connect();

    const store = useStore();
    socket.on('me', (response: MeUserObject) => {
        store.me = response;
    });

    socket.on('logout', () => {
        window.location.href = '/logout';
    });
}
