<template>
    <common-box>
        <common-input-text
            v-model="username"
            @keyup.enter="signup"
        >Username</common-input-text>
        <common-input-text
            v-model="email"
            @keyup.enter="signup"
        >E-Mail</common-input-text>
        <common-input-text
            v-model="password"
            input-type="password"
            @keyup.enter="signup"
        >Password</common-input-text>
        <common-input-text
            v-model="passwordre"
            input-type="password"
            @keyup.enter="signup"
        >Repeat Password</common-input-text>
        <common-button @click="signup">Signup</common-button>
    </common-box>
</template>

<script setup lang="ts">
import { socket } from '~/components/socket';

const router = useRouter();

const username = ref<string>();
const password = ref<string>();
const passwordre = ref<string>();
const email = ref<string>();

interface SignupResponse {
    redirect?: string;
    message?: string;
}

async function signup() {
    try {
        const response = await $fetch<SignupResponse>('/api/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                username: username.value,
                password: password.value,
                passwordRepeated: passwordre.value,
                email: email.value,
            }),
        });
        if (response.redirect) {
            socket.disconnect();
            socket.connect();

            socket.emit('me');
            router.push(response.redirect);
        }
    }
    catch (error) {
        console.error('Signup failed', error);
    }
}
</script>
