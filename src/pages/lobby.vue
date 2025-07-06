<template>
    <div v-if="lobby">
        <p>Running: {{ lobby.gameStarted }}</p>
        <p>ID: {{ lobby.token }}</p>
    </div>
    <div v-else>
        <common-button @click="createLobby()">Create Lobby</common-button>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';
import type { LobbyData } from '~/types/game';

const store = useStore();

const route = useRoute();

const loading = ref(true);

const lobby: Ref<LobbyData | undefined> = ref();

onMounted(async () => {
    const lobbyParamId = route.query.id as string;
    const lobbyIdStore = store.lobbyCode;

    let lobbyId;
    if (lobbyParamId) {
        lobbyId = lobbyParamId;
    } else if(lobbyIdStore) {
        lobbyId = lobbyIdStore;
    }

    if (lobbyId) {
        const { data } = await useAsyncData(
            'lobby',
            () => $fetch<LobbyData>('/api/lobby', { query: { id: lobbyId } }),
        );

        if (data.value) {
            lobby.value = data.value;
        }
    }

    loading.value = false;
});

async function createLobby(){
    const data = await $fetch('/api/v1/lobby/create');

    let lobbyData = undefined;
    if (data && typeof data.founded === 'string') {
        lobbyData = {...data, founded: new Date(data.founded)};

        lobby.value = lobbyData;
        store.lobbyCode = lobbyData.token;
    }    
}
</script>
