<template>
    <div>
        <common-button @click="createLobby()">Create Lobby</common-button>
        <div>
            <common-input-text
                v-model="lobbyCode"
                @keyup.enter="join()"
            >Lobby Code</common-input-text>
            <common-button @click="join()">Join</common-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';
import { useWebSocket } from '@vueuse/core';

const store = useStore();

const router = useRouter();

const lobbyCode = ref('');

const { send } = useWebSocket(`/ws`, {
    onMessage(ws, event) {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.action === 'lobby') {
            const lobbyId = data.lobby.token;
            store.lobbyCode = lobbyId;
            router.replace(`/lobby/${ lobbyId }`);
        }
        else if (data.action === 'leave_lobby') {
            store.lobbyCode = '';
            router.replace('/lobby');
        }
        else if (data.action === 'game_start') {
            router.replace('/game/');
        }
    },
});

onMounted(async () => {
    const lobbyId = store.lobbyCode;

    if (lobbyId) {
        router.replace(`/lobby/${ lobbyId }`);
    }
});

function createLobby() {
    send(JSON.stringify({ topic: 'lobby', action: 'create' }));
}

function join() {
    router.replace(`/lobby/${ lobbyCode.value }`);
}
</script>
