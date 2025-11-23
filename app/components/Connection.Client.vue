<template>
    <div :class="setup ? 'setup' : isConnected ? 'setup connected' : 'setup disconnected'"/>
</template>

<script setup lang="ts">
import { socket } from './socket';

const isConnected = ref(false);
const setup = ref(false);

function updateConnectionStatus() {
    isConnected.value = socket.connected;
}

function onDisconnect() {
    isConnected.value = false;
}

function onConnect() {
    isConnected.value = true;
}

onMounted(() => {
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Initial connection state
    updateConnectionStatus();
    setup.value = false;
});

onBeforeUnmount(() => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
});
</script>

<style lang="scss">
.setup {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: orange;
}

.disconnected {
    background: red;
}

.connected {
    background: green;
}
</style>
