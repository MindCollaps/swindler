<template>
    <div>
        <common-input-text v-model="username">Username</common-input-text>
        <common-input-text v-model="email">E-Mail</common-input-text>
        <common-input-text
            v-model="password"
            input-type="password"
        >Password</common-input-text>
        <common-input-text
            v-model="passwordre"
            input-type="password"
        >Repeat Password</common-input-text>
        <common-button @click="signup">Signup</common-button>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';
import { socket } from '~/components/socket';

const store = useStore();

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

            store.fetchMe();
            await navigateTo(response.redirect);
        }
    }
    catch (error) {
        console.error('Signup failed', error);
    }
}
</script>
