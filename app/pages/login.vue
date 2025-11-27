<template>
    <div>
        <common-input-text
            v-model="username"
            @keyup.enter="login"
        >Username</common-input-text>
        <common-input-text
            v-model="password"
            input-type="password"
            @keyup.enter="login"
        >Password</common-input-text>
        <common-button @click="login">Login</common-button>
    </div>
</template>

<script setup lang="ts">
import { socket } from '~/components/socket';

const router = useRouter();
const username = ref<string>();
const password = ref<string>();

interface LoginResponse {
    redirect?: string;
    message?: string;
}

async function login() {
    try {
        const response = await $fetch<LoginResponse>('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username: username.value,
                password: password.value,
            }),
        });
        if (response.redirect) {
            // Auth cookie in socket
            socket.disconnect();
            socket.connect();

            socket.emit('me');
            router.push(response.redirect);
        }
    }
    catch (error) {
        console.error('Login failed', error);
    }
}
</script>
