<template>
    <div>
        {{ lobby?.token }}
        {{ lobby?.founder.username }}
        <div>
            <div
                v-for="wordList in wordLists"
                :key="wordList.name"
            >
                {{ wordList.name }}
            </div>
        </div>
        <common-button>Start Game</common-button>
    </div>
</template>

<script setup lang="ts">
import { io } from 'socket.io-client';
import type { FetchingLobby, FetchingWordList } from '~~/types/fetch';
import { socket } from '~/components/socket';

const lobby = shallowRef<FetchingLobby>();
const wordLists = shallowRef<FetchingWordList[]>();
// const players = shallowRef<>();
const route = useRoute();
const router = useRouter();
const lobbyId = route.params.id;

socket.on('lobby', data => {
    const lobbySoc = io(`/lobby-${ data }`, { path: '/socket.io' });

    lobbySoc.on('wordLists', data => {
        wordLists.value = data;
    });
    lobbySoc.on('lobby', data => {
        lobby.value = data;
    });
    lobbySoc.on('redirect', data => {
        router.push(data);
    });
});

// socket.on('players', data => players.value = data);

onMounted(() => {
    socket.emit('lobby', lobbyId);
});
</script>
