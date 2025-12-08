<template>
    <div v-if="lobby">
        <template v-if="showReady">
            Players {{ lobby.players.filter(x => x.ready).length }} / {{ lobby.players.length }} Ready
        </template>
        <div>
            You
            <div
                v-for="player in lobby.players.filter(x => x.id !== store.me?.userid || x.fakeUser !== store.me.fakeUser)"
                :key="player.fakeUser ? player.id * -1 : player.id"
            >
                {{ player.username }}
                <template v-if="showReady">{{ player.ready }}</template>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
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
