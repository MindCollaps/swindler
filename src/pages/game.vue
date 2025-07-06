<template>
    <div v-if="lobby && game">
        <p>ID: {{ lobby.token }}</p>
        <p v-if="game.yourTurn">Its your turn to say a word!</p>
        <p v-else>Its {{ game.turn }}'s turn'</p>
        <p v-if="!game.impostor">Word: {{ game.word }}</p>
        <p v-else>You are impostor, try not to get caught!</p>
        <common-button
            v-if="game.yourTurn"
            @click="endTurn()"
        >End turn</common-button>
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
import { devGameData, devLobby } from '~/types/dev';
import type { GameData, LobbyData } from '~/types/game';

const route = useRoute();

const loading = ref(true);

const lobby: Ref<LobbyData | undefined> = ref(devLobby);
const game: Ref<GameData | undefined> = ref(devGameData);

onMounted(async () => {
    const lobbyId = route.query.id as string;
    if (lobbyId) {
        const { data } = await useAsyncData(
            'lobby',
            () => $fetch<LobbyData>('/api/lobby', { query: { id: lobbyId } }),
            { immediate: true },
        );

        if (data.value) {
            lobby.value = data.value;

            const { data: gameData } = await useAsyncData(
                'game',
                () => $fetch<GameData>('/api/game', { query: { id: lobbyId } }),
                { immediate: true },
            );

            if (gameData.value) {
                game.value = gameData.value;
            }
        }
    }

    loading.value = false;
});

async function endTurn() {
    $fetch('/api/game/endturn');
}

async function vote(up: boolean) {
    $fetch('/api/game/vote', { query: { up } });
}
</script>
