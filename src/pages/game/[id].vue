<template>
    <div v-if="lobby && game">
        <p>ID: {{ lobby.token }}</p>
        <p v-if="game.yourTurn">Its your turn to say a word!</p>
        <p v-else>Its {{ game.turn }}'s turn'</p>
        <p v-if="!game.impostor">Word: {{ game.word }}</p>
        <p v-else>You are impostor, try not to get caught!</p>
        <div v-if="game.yourTurn">
            <common-input-text>Word</common-input-text>
            <common-button>Send Word</common-button>
        </div>
        <common-button
            v-if="!game.yourTurn"
            @click="vote(true)"
        >Up Vote</common-button>
        <common-button
            v-if="!game.yourTurn"
            @click="vote(false)"
        >Down Vote</common-button>
    </div>
</template>

<script setup lang="ts">
import type { GameData, LobbyData } from '~/types/game';

const route = useRoute();

const loading = ref(true);

const lobby: Ref<LobbyData | undefined> = ref();
const game: Ref<GameData | undefined> = ref();

onMounted(async () => {
    const lobbyId = route.query.id as string;
    if (lobbyId) {
        const { data, refresh: refreshLobby } = await useAsyncData(
            'lobby',
            () => $fetch<LobbyData>('/api/v1/lobby', { query: { id: lobbyId } }),
            { immediate: true },
        );

        await refreshLobby();

        if (data.value) {
            lobby.value = data.value;

            const { data: gameData, refresh: refreshGame } = await useAsyncData(
                'game',
                () => $fetch<GameData>('/api/v1/game', { query: { id: lobbyId } }),
            );

            await refreshGame();

            if (gameData.value) {
                game.value = gameData.value;
            }
        }
    }

    loading.value = false;
});

async function vote(up: boolean) {
    //TODO Make Websocket
    $fetch('/api/v1/game/vote', { query: { up } });
}
</script>
