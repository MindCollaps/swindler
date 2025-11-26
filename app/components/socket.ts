import { io } from 'socket.io-client';
import { useStore } from '~/store';
import type { MeUserObject } from '~~/types/socket';

export const socket = io('/', { path: '/socket.io' });

export function useSocket() {
    const router = useRouter();

    const store = useStore();

    onMounted(() => {
        socket.on('me', (response: MeUserObject) => {
            store.me = response;
        });
        socket.on('logout', () => {
            window.location.href = '/logout';
        });
        socket.on('redirect', value => {
            router.push(value);
        });
    })

    onUnmounted(() => {
        socket.disconnect();
    })
}
