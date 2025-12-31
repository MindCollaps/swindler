<template>
    <common-page title="Profile Page">
        <p>Welcome, {{ store.me?.username }}!</p>

        <common-button href="/logout">Logout</common-button>
    </common-page>
</template>

<script setup lang="ts">
import { useStore } from '~/store';

const store = useStore();
</script>

