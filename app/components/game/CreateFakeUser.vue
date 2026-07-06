<template>
    <div>
        <common-input-text
            v-model="nickname"
            :input-attrs="{ maxlength: 24, autocomplete: 'nickname' }"
            placeholder="What should we call you?"
            @keyup.enter="join"
        >Nickname</common-input-text>
        <common-button
            :disabled="joining || !nickname?.trim()"
            @click="join"
        >{{ joining ? 'Joining...' : (lobbyId ? 'Join Lobby' : 'Create Lobby') }}</common-button>
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
const joining = ref(false);

interface SignupResponse {
    redirect?: string;
    message?: string;
}

async function join() {
    const name = nickname.value?.trim();
    if (!name) {
        showToast({
            mode: ToastMode.Error,
            message: 'Pick a nickname first',
            duration: 5000,
        });
        return;
    }
    if (joining.value) return;

    joining.value = true;
    try {
        await $fetch<SignupResponse>('/api/v1/auth/join', {
            method: 'POST',
            body: JSON.stringify({
                nickname: name,
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
        let message = error.data?.message || error.data?.statusMessage || error.statusMessage || 'Could not join. Check your connection and try again.';

        if (Array.isArray(error.data?.data)) {
            message = error.data.data.map((i: any) => i.message).join('\n');
        }

        showToast({
            mode: ToastMode.Error,
            message,
            duration: 8000,
        });
    }
    finally {
        joining.value = false;
    }
}
</script>
