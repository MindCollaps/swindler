<template>
    <div>
        <common-input-text
            v-model="nickname"
            @keyup.enter="join"
        >Nickname</common-input-text>
        <common-button @click="join">Join</common-button>
    </div>
</template>

<script setup lang="ts">
import { socket } from '~/components/socket';

const props = defineProps({
    lobby: {
        type: String as PropType<string>,
    },
});

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
                lobby: props.lobby,
            }),
        });
        socket.disconnect();
        socket.connect();

        socket.emit('me');
    }
    catch (error) {
        console.error('Signup failed', error);
    }
}
</script>
