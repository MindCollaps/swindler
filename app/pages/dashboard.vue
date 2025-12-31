<template>
    <common-page title="Dashboard">
        <common-button
            v-if="store.me?.loggedIn"
            to="/lobby"
        >Create Lobby</common-button>
    </common-page>
</template>

<script setup lang="ts">
import { useStore } from '~/store';

const store = useStore();
</script>
