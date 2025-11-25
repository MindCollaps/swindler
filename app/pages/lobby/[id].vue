<template>
    <div>
        Info
        <br>
        {{ lobby?.token }}
        {{ lobby?.founder.username }}
        <br>
        Players
        <div>
            <div
                v-for="player in lobby?.players"
                :key="player.id"
            >
                {{ player.username }}
            </div>
        </div>
        <br>
        Wordlists
        <div>
            <div
                v-for="wordList in wordLists"
                :key="wordList.name"
            >
                {{ wordList.name }}
            </div>
        </div>
        <common-button @click="startGame()">Start Game</common-button>
    </div>
</template>

<script setup lang="ts">
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { FetchingWordList } from '~~/types/fetch';
import { socket } from '~/components/socket';
import type { RedisLobby } from '~~/types/redis';

const lobby = shallowRef<RedisLobby>();
const wordLists = shallowRef<FetchingWordList[]>();
// const players = shallowRef<>();
const route = useRoute();
const router = useRouter();
const lobbyId = route.params.id;

let lobbySoc: Socket;

socket.on('lobby', data => {
    lobbySoc = io(`/lobby-${ data }`, { path: '/socket.io' });

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
        router.push(`/game/${ lobbyId }`);
    });
});

function startGame() {
    lobbySoc.emit('start');
}

// socket.on('players', data => players.value = data);

onMounted(() => {
    socket.emit('lobby', lobbyId);
});

onUnmounted(() => {
    socket.off('lobby');
});
</script>
