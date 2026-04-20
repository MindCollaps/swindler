<template>
    <common-box>
        <h1>Lobby not found</h1>
        <p>This lobby does not exist.</p>
        <common-input-text
            v-model="lobbyCode"
            @keyup.enter="router.push(`/lobby/${ lobbyCode }`)"
        >
            Lobby Code
        </common-input-text>
        <common-button @click="router.push(`/lobby/${ lobbyCode }`)">
            Join
        </common-button>
        <common-button @click="router.push('/lobby')">
            Create Lobby
        </common-button>
    </common-box>
</template>

<script setup lang="ts">
const lobbyCode = ref('');
const router = useRouter();
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
