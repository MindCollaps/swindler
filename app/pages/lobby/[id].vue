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
import { socket } from '~/components/socket';
import { useLobbySocket } from '~/composables/sockets/lobby';

const route = useRoute();
const lobbyId: string = route.params.id as string;

const {lobbySoc, lobby, wordLists, reconnect} = useLobbySocket(lobbyId);

socket.once('lobby', () => {
    reconnect();
})

function startGame() {
    lobbySoc.emit('start');
}

onMounted(() => {
    socket.emit('lobby', lobbyId);
});

onUnmounted(() => {
    socket.off('lobby');
});
</script>
