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
import type { PropType } from 'vue';
import { isSameUser } from '~/utils/user';
import type { Lobby } from '~~/types/redis';
import { useStore } from '~/store';

defineProps({
    lobby: {
        type: Object as PropType<Lobby | null>,
    },
    showReady: {
        type: Boolean,
        default: false,
    },
});

const store = useStore();
</script>
