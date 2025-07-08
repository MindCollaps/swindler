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
import { useStore } from '~/store';
import { useWebSocket } from '@vueuse/core';

const store = useStore();
const router = useRouter();

const loading = ref(true);

const lobby: Ref<LobbyData | undefined> = ref();
const game: Ref<GameData | undefined> = ref();

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
        else if (data.action === 'game') {
            game.value = data.game as GameData;
        }
    },
});

onMounted(async () => {
    if (store.lobbyCode) {
        send(JSON.stringify({ topic: 'game', action: 'join', data: { lobbyId: store.lobbyCode } }));
    }
    else {
        router.replace('/lobby');
    }

    loading.value = false;
});

async function vote(up: boolean) {
    // TODO Make Websocket
}
</script>
