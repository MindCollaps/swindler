<template>
    <div v-if="lobby">
        <p>ID: {{ lobby.token }}</p>
        <p v-if="lobby.gameStarted">Game Started!</p>
        <common-button
            v-if="!lobby.gameStarted"
            @click="gameStart()"
        >Start game</common-button>
        <common-button
            v-if="lobby.gameStarted"
            @click="joinGame()"
        >Join game</common-button>
        <div
            v-for="user in lobby.players"
            :key="user.username"
        >
            <p>{{ user.username }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';
import type { LobbyData } from '~/types/game';
import { useWebSocket } from '@vueuse/core';

const store = useStore();

const route = useRoute();
const router = useRouter();

const loading = ref(true);

const lobby: Ref<LobbyData | undefined> = ref();

const { send } = useWebSocket(`/ws`, {
    onMessage(ws, event) {
        console.log(event.data);
        const data = JSON.parse(event.data);
        if (data.action === 'lobby') {
            lobby.value = data.lobby as LobbyData;
        }
        else if (data.action === 'leave_lobby') {
            store.lobbyCode = '';
            router.replace('/lobby');
        }
        else if (data.action === 'game_start') {
            router.replace('/game');
        }
    },
});

function joinGame() {

}

function gameStart() {
    send(JSON.stringify({ topic: 'lobby', action: 'game_start' }));
}

onMounted(async () => {
    const lobbyParamId = route.params.id as string;
    const lobbyIdStore = store.lobbyCode;

    let lobbyId;
    if (lobbyParamId) {
        lobbyId = lobbyParamId;
        store.lobbyCode = lobbyId;
    }
    else if (lobbyIdStore) {
        lobbyId = lobbyIdStore;
    }

    if (lobbyId) {
        send(JSON.stringify({ topic: 'lobby', action: 'join', data: { lobbyId: lobbyId } }));
    }
    else {
        router.replace('/lobby');
    }

    loading.value = false;
});
</script>
