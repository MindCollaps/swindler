<template>
    <div>
        <common-input-text
            v-model="nickname"
            @keyup.enter="join"
        >Nickname</common-input-text>
        <common-button @click="join">{{ lobbyId ? 'Join Lobby' : 'Create Lobby' }}</common-button>
    </div>
</template>

<script setup lang="ts">
import { socket } from '~/components/socket';
import { useLobbySocket } from '~/composables/sockets/lobby';
import { ToastMode } from '~~/types/toast';

const props = defineProps({
    lobbyId: {
        required: false,
        type: String,
    },
});
const { showToast } = useToastManager();

const nickname = ref<string>();

interface SignupResponse {
    redirect?: string;
    message?: string;
}

async function join() {
    try {
        await $fetch<SignupResponse>('/api/v1/auth/join', {
            method: 'POST',
            body: JSON.stringify({
                nickname: nickname.value,
            }),
        });
        socket.disconnect();
        socket.connect();
        if (props.lobbyId) {
            const { lobbySocket } = useLobbySocket(props.lobbyId);
            lobbySocket.disconnect();
            lobbySocket.connect();
        }

        socket.emit('me');
    }
    catch (error: any) {
        let message = error.data?.message || error.data?.statusMessage || error.statusMessage || 'Creation failed';

        if (Array.isArray(error.data?.data)) {
            message = error.data.data.map((i: any) => i.message).join('\n');
        }

        showToast({
            mode: ToastMode.Error,
            message,
            duration: 8000,
        });
    }
}
</script>
