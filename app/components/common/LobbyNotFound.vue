<template>
    <div class="lobby-not-found">
        <h1>Lobby not found</h1>
        <p>This lobby does not exist.</p>
        <common-button @click="redirectHome">
            {{ (!store.me || store.me.fakeUser) ? 'Go Home' : 'Create Lobby' }}
        </common-button>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';

const store = useStore();

function redirectHome() {
    if (!store.me || store.me.fakeUser) {
        navigateTo('/');
    }
    else {
        navigateTo('/lobby');
    }
}
</script>

<style scoped lang="scss">
.lobby-not-found {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;

    height: 100vh;

    h1 {
        font-size: 2rem;
        color: $error500;
    }
}
</style>
