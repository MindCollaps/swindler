import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useStore } from '~/store';
import type { MeUserObject } from '~~/types/socket';

export let socket: Socket;

export function setupSocket() {
    if (!socket) {
        socket = io('/', { path: '/socket.io', autoConnect: false });
    }

    const router = useRouter();

    const store = useStore();

    onBeforeMount(() => {
        if (socket.connected) return;

        socket.on('me', (response: MeUserObject) => {
            store.me = response;
            store.ready = true;
        });
        socket.on('logout', () => {
            window.location.href = '/logout';
        });
        socket.on('redirect', value => {
            router.push(value);
        });

        socket.connect();
    });
}
