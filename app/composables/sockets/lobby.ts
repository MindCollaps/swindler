import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { FetchingWordList } from '~~/types/fetch';
import { registerToastManager } from '../toastManager';
import { useLobbyGameStore } from '~/store/lobby-game';

let lobbySocket: Socket | undefined;
const wordLists: Ref<FetchingWordList[] | null> = ref(null);
let listenersBound = false;

const disconnect = () => {
    const lobbyStore = useLobbyGameStore();
    if (lobbySocket) {
        lobbySocket.disconnect();
        lobbySocket.off();

        lobbySocket = undefined;
        listenersBound = false;
    }
    lobbyStore.reset();
};

export function useLobbySocket(lobbyId: string, options?: { onDisconnect: () => void }) {
    const lobbyStore = useLobbyGameStore();
    const { lobby, connected, lobbyNotFound, connectionError, spectator } = storeToRefs(lobbyStore);

    if (!lobbySocket) lobbySocket = io(`/lobby-${ lobbyId }`, { path: '/socket.io', autoConnect: false });

    const connect = () => {
        if (!lobbySocket || lobbySocket?.connected) return;

        const router = useRouter();

        registerToastManager(lobbySocket);

        if (!listenersBound) {
            lobbySocket.on('connect', () => {
                lobbyStore.setConnected(true);
                lobbyStore.setLobbyNotFound(false);
                lobbyStore.setConnectionError(false);
                console.log(`✅ lobby socket ${ lobbyId } connected`);
            });

            lobbySocket.on('connect_error', err => {
                if (err.message === 'Unauthorized') {
                    return;
                }
                // The server only creates a namespace for lobbies that exist, so
                // "Invalid namespace" is the genuine not-found signal. Everything
                // else (xhr poll error, timeout, websocket error) is a network or
                // server problem and must not be reported as a missing lobby.
                if (err.message === 'Invalid namespace') {
                    lobbyStore.setLobbyNotFound(true);
                }
                else {
                    lobbyStore.setConnectionError(true);
                }
                lobbyStore.setConnected(false);
                console.log(`❌ lobby socket ${ lobbyId } connection error`, err);
            });

            lobbySocket.io.on('reconnect_attempt', () => {
                lobbyStore.setConnected(false);
                lobbyStore.setConnectionError(false);
            });

            lobbySocket.io.on('reconnect', () => {
                lobbyStore.setConnected(true);
                lobbyStore.setConnectionError(false);
                lobbyStore.setLobbyNotFound(false);
            });

            lobbySocket.on('disconnect', () => {
                lobbyStore.setConnected(false);
                if (options?.onDisconnect) {
                    options.onDisconnect();
                }
                console.log(`❌ lobby socket ${ lobbyId } disconnected`);
            });

            lobbySocket.on('lobby', data => {
                lobbyStore.setLobby(data);

                if (lobbyStore.lobby?.gameRunning && router.currentRoute.value.path == `/lobby/${ lobbyId }`) {
                    router.push(`/game/${ lobbyId }`);
                }
            });
            lobbySocket.on('wordLists', data => {
                wordLists.value = data;
            });
            lobbySocket.on('lobbyWordLists', data => {
                if (lobbyStore.lobby?.wordLists) {
                    lobbyStore.lobby.wordLists = data;
                }
            });
            lobbySocket.on('redirect', data => {
                router.push(data);
            });
            lobbySocket.on('start', () => {
                router.push(`/game/${ lobbyId }`);
            });
            lobbySocket.on('players', value => {
                if (lobbyStore.lobby?.players) {
                    lobbyStore.lobby.players = value;
                }
            });
            lobbySocket.on('gameIsRunning', () => {
                lobbyStore.setSpectator(true);
                console.log('Game is running, switched to spectator mode.');
            });
            lobbySocket.on('returnToLobby', () => {
                if (lobbyStore.spectator) {
                    lobbyStore.setSpectator(false);
                    lobbySocket?.disconnect();
                    lobbySocket = undefined;
                    listenersBound = false;
                    router.push(`/lobby/${ lobbyId }`);
                }
            });

            listenersBound = true;
        }
        lobbyStore.setLobbyNotFound(false);
        lobbySocket.connect();

        onBeforeRouteLeave(to => {
            const allowedPrefixes = [`/game/${ lobbyId }`, `/lobby/${ lobbyId }`];

            const goingOutsideGame = !allowedPrefixes.some(prefix => to.path.startsWith(prefix));

            if (goingOutsideGame) {
                disconnect();
                lobbySocket = undefined;
            }
        });
    };

    onMounted(connect);

    const retry = () => {
        if (!lobbySocket) return;
        lobbyStore.setConnectionError(false);
        lobbyStore.setLobbyNotFound(false);
        lobbySocket.connect();
    };

    return { lobbySocket, lobby, wordLists, disconnect, connected, lobbyNotFound, connectionError, retry, spectator };
}
