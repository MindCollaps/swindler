<template>
    <common-button @click="login">Login</common-button>
</template>

<script setup lang="ts">
function login() {
    $fetch('/api/v1/login');
}
</script>
