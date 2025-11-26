<template>
    <div>
        Info
        <br>
        <br>
        Players
        <div>
            <div
                v-for="player in lobby?.players"
                :key="player.id"
            >
                {{ player.username }}
            </div>
        </div>
        <br>
    </div>
</template>

<script setup lang="ts">
import { socket } from '~/components/socket';
import type { Lobby } from '~~/types/redis';

const lobby = shallowRef<Lobby>();
// const players = shallowRef<>();
const route = useRoute();
const router = useRouter();
const lobbyId = route.params.id;



onMounted(() => {
    socket.emit('lobby', lobbyId);
});

onUnmounted(() => {
    socket.off('lobby');
});
</script>
