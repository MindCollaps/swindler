<template>
    <common-page title="Welcome to Swindler!">
        <p v-if="store.me?.loggedIn">Hello, {{ store.me.username }}!</p>
        <common-button
            v-if="store.me?.loggedIn && !store.me.fakeUser"
            to="/lobby"
        >Create Lobby</common-button>
    </common-page>
</template>

<script setup lang="ts">
import { useStore } from '~/store';

const store = useStore();
</script>

