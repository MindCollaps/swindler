<template>
    <div>
        <common-input-text v-model="username">Username</common-input-text>
        <common-input-text
            v-model="password"
            input-type="password"
        >Password</common-input-text>
        <common-button @click="login">Login</common-button>
    </div>
</template>

<script setup lang="ts">
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
            await navigateTo(response.redirect);
        }
    }
    catch (error) {
        console.error('Login failed', error);
    }
}
</script>
