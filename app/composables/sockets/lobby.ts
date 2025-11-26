import { io, Socket } from "socket.io-client";
import { useRouter } from "vue-router";
import type { FetchingWordList } from "~~/types/fetch";
import type { Lobby } from "~~/types/redis";

let lobbySoc: Socket;

export function useLobbySocket(lobbyId: string) {
    const lobby: Ref<Lobby | null> = ref(null);
    const wordLists: Ref<FetchingWordList[] | null> = ref(null);
    const router = useRouter();

    const connect = () => {
        console.log('connect')
        lobbySoc = io(`/lobby-${lobbyId}`, { path: "/socket.io" });
        lobbySoc.connect();

        lobbySoc.on("lobby", (data) => {
            lobby.value = data;
        });
        lobbySoc.on('wordLists', data => {
            wordLists.value = data;
        });
        lobbySoc.on('lobby', data => {
            lobby.value = data;
        });
        lobbySoc.on('redirect', data => {
            router.push(data);
        });
        lobbySoc.on('start', () => {
            router.push(`/game/${lobbyId}`);
        });
        lobbySoc.on('players', value => {
            if (lobby.value?.players) {
                lobby.value.players = value;
            }
        });
    }

    const disconnect = () => {
        if (lobbySoc) {
            lobbySoc.disconnect();
        }
    };

    const reconnect = () => {
        if (lobbySoc) {
            lobbySoc.connect();
        }
    }

    onMounted(() => {
        connect();
    });

    onUnmounted(() => {
        disconnect();
    });

    return { lobbySoc, lobby, wordLists, disconnect, reconnect };
}

export function useGameSocket(lobbyId: string) {
    const {lobby, lobbySoc, disconnect: lobbyDisconnect} = useLobbySocket(lobbyId);

    const connect = () => {
        lobbySoc.off('start');
        lobbySoc.off('wordLists');
        lobbySoc.on('game', value => {
            
        })
    }

    const disconnect = () => {
        if (lobbySoc) {
            lobbyDisconnect();
        }
    };

    onMounted(() => {
        connect();
    });

    onUnmounted(() => {
        disconnect();
    });

    return { lobbySoc, lobby, disconnect };
}