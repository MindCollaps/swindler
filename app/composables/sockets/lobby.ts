import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useRouter } from 'vue-router';
import type { FetchingWordList } from '~~/types/fetch';
import type { Lobby } from '~~/types/redis';

let lobbySocket: Socket | undefined;
const lobby: Ref<Lobby | null> = ref(null);
const wordLists: Ref<FetchingWordList[] | null> = ref(null);
const connected: Ref<boolean> = ref(false);
const lobbyNotFound: Ref<boolean> = ref(false);
const spectator: Ref<boolean> = ref(false);

const disconnect = () => {
    if (lobbySocket) {
        lobbySocket.disconnect();
        lobbySocket.off();

        lobbySocket = undefined;
    }
};

export function useLobbySocket(lobbyId: string, options?: { onDisconnect: () => void }) {
    if (!lobbySocket) lobbySocket = io(`/lobby-${ lobbyId }`, { path: '/socket.io', autoConnect: false });

    const connect = () => {
        if (!lobbySocket || lobbySocket?.connected) return;

        const router = useRouter();

        lobbySocket.on('connect', () => {
            connected.value = true;
            lobbyNotFound.value = false;
            console.log(`✅ lobby socket ${ lobbyId } connected`);
        });

        lobbySocket.on('connect_error', err => {
            if (err.message === 'Unauthorized') {
                return;
            }
            lobbyNotFound.value = true;
            connected.value = false;
            console.log(`❌ lobby socket ${ lobbyId } connection error`, err);
        });

        lobbySocket.on('disconnect', () => {
            connected.value = false;
            if (options?.onDisconnect) {
                options.onDisconnect();
            }
            console.log(`❌ lobby socket ${ lobbyId } disconnected`);
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
        lobbySocket.on('gameIsRunning', value => {
            spectator.value = true;
            console.log('Game is running, switched to spectator mode.');
        });
        lobbySocket.on('returnToLobby', value => {
            if (spectator.value) {
                spectator.value = false;
                lobbySocket?.disconnect();
                lobbySocket = undefined;
                router.push(`/lobby/${ lobbyId }`);
            }
        });

        lobbyNotFound.value = false;
        lobbySocket.connect();

        onBeforeRouteLeave((to, from, next) => {
            const allowedPrefixes = [`/game/${ lobbyId }`, `/lobby/${ lobbyId }`];

            const goingOutsideGame = !allowedPrefixes.some(prefix => to.path.startsWith(prefix));

            if (goingOutsideGame) {
                disconnect();
                lobbySocket = undefined;
            }
            next();
        });
    };

    onMounted(connect);

    return { lobbySocket, lobby, wordLists, disconnect, connected, lobbyNotFound, spectator };
}
