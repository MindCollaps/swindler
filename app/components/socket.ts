import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { registerToastManager } from '~/composables/toastManager';
import { useStore } from '~/store';
import type { MeUserObject } from '~~/types/socket';
import { ToastMode } from '~~/types/toast';

export let socket: Socket;

export function setupSocket() {
    if (!socket) {
        socket = io('/', { path: '/socket.io', autoConnect: false });
    }

    const router = useRouter();
    const store = useStore();
    const { showToast } = useToastManager();

    onBeforeMount(() => {
        if (socket.connected) return;

        registerToastManager(socket);

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
        socket.on('errorMessage', message => {
            showToast({
                mode: ToastMode.Error,
                message: message,
            });
        });

        socket.connect();
    });
}
