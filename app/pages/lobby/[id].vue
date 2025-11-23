<template>
    <div v-if="lobby">
        {{ lobby.token }}
    </div>
</template>

<script setup lang="ts">
import type { FetchingLobby } from '~~/types';

const route = useRoute();

const lobbyId = route.params.id as string;

const lobby = shallowRef<FetchingLobby | undefined>();

async function fetchLobby(lobbyId: string) {
    const data = await $fetch<FetchingLobby>(`/api/v1/lobby/${ lobbyId }`);

    if (!data) {
        return;
    }

    lobby.value = data;
}

onMounted(async () => {
    await fetchLobby(lobbyId);
});
</script>
