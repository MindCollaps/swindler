<template>
    <div v-if="lobby">
        <template v-if="showReady">
            Players {{ lobby.players.filter(x => x.ready).length }} / {{ lobby.players.length }} Ready
        </template>
        <div>
            You
            <div
                v-for="player in lobby.players.filter(x => !isSameUser({ id: x.id, fakeUser: x.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false }))"
                :key="player.id"
            >
                {{ player.username }}
                <template v-if="showReady">{{ player.ready }}</template>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { isSameUser } from '~/utils/user';
import { useGameSocket } from '~/composables/sockets/game';
import { useStore } from '~/store';

defineProps({
    showReady: {
        type: Boolean,
        default: false,
    },
});
const route = useRoute();
const lobbyId = route.params.id as string;

const { lobby } = useGameSocket(lobbyId);

const store = useStore();
</script>
