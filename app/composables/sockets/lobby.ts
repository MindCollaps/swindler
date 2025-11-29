import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useRouter } from 'vue-router';
import type { FetchingWordList } from '~~/types/fetch';
import type { Lobby } from '~~/types/redis';

let lobbySocket: Socket | undefined;
const lobby: Ref<Lobby | null> = ref(null);
const wordLists: Ref<FetchingWordList[] | null> = ref(null);
const connected: Ref<boolean> = ref(false);

export function useLobbySocket(lobbyId: string) {
    const router = useRouter();

    if (!lobbySocket) lobbySocket = io(`/lobby-${ lobbyId }`, { path: '/socket.io', autoConnect: false });

    const connect = () => {
        if (!lobbySocket || lobbySocket?.connected) return;

        lobbySocket.on('connect', () => {
            connected.value = true;
        });

        lobbySocket.on('disconnect', () => {
            connected.value = false;
        });

        lobbySocket.on('lobby', data => {
            lobby.value = data;
        });
        lobbySocket.on('wordLists', data => {
            wordLists.value = data;
        });
        lobbySocket.on('lobbyWordLists', data => {
            if (lobby.value?.wordLists) {
                lobby.value.wordLists = data;
            }
        });
        lobbySocket.on('lobby', data => {
            lobby.value = data;
        });
        lobbySocket.on('redirect', data => {
            router.push(data);
        });
        lobbySocket.on('start', () => {
            router.push(`/game/${ lobbyId }`);
        });
        lobbySocket.on('players', value => {
            if (lobby.value?.players) {
                lobby.value.players = value;
            }
        });

        lobbySocket.connect();
    };

    const disconnect = () => {
        if (lobbySocket) {
            lobbySocket.disconnect();
            lobbySocket.off();
            console.log('lobby socket disconnected');
        }
    };

    onMounted(connect);
    onBeforeRouteLeave((to, from, next) => {
        const allowedPrefixes = ['/game/', '/lobby/'];

        const goingOutsideGame = !allowedPrefixes.some(prefix => to.path.startsWith(prefix));

        if (goingOutsideGame) {
            disconnect();
            lobbySocket = undefined;
        }
        next();
    });

    return { lobbySocket, lobby, wordLists, disconnect, connected };
}
