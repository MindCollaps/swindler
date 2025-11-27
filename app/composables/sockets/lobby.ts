import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useRouter } from 'vue-router';
import type { FetchingWordList } from '~~/types/fetch';
import type { Lobby, LobbyGame } from '~~/types/redis';

export let lobbySocket: Socket;

export function useLobbySocket(lobbyId: string) {
    const lobby: Ref<Lobby | null> = ref(null);
    const wordLists: Ref<FetchingWordList[] | null> = ref(null);
    const game: Ref<LobbyGame | null> = ref(null);
    const connected: Ref<boolean> = ref(false);

    const router = useRouter();

    lobbySocket = io(`/lobby-${ lobbyId }`, { path: '/socket.io', autoConnect: false });


    const connect = () => {
        if (lobbySocket.connected) return;
        console.log('lobby socket connected');
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
        lobbySocket.on('game', value => {
            game.value = value;
            console.log(game.value);
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

    const reconnect = () => {
        if (lobbySocket) {
            lobbySocket.connect();
        }
    };

    onMounted(connect);
    // onUnmounted(disconnect);

    return { game, lobby, wordLists, disconnect, reconnect, connected };
}
