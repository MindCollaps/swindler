<template>
    <template v-if="store.me?.developer">
        {{ JSON.stringify(game) }}
        <br><br>
        {{ JSON.stringify(lobby) }}
        <br><br>
        {{ JSON.stringify(voted) }}
        <br><br>
    </template>
    <div class="cue-wrapper"><div class="cue-giver">{{ clue?.player.username }}</div> said <div class="cue-text">{{ clue?.clue }}</div></div>
    <game-info
        :game="game"
        :lobby="lobby"
        only-word
    />
    <vote/>
    <div class="timer">
        Time until continue: {{ timeRemaining }}s
    </div>
    <common-button
        class="skip-wait"
        :disabled="isReady"
        @click="$emit('skipWait')"
    >
        {{ isReady ? 'Waiting for others...' : 'Ready' }} ({{ game?.readyToContinue?.length ?? 0 }}/{{ lobby?.players.length ?? 0 }})
    </common-button>
    <word-log/>
</template>

<script setup lang="ts">
import Vote from '~/components/game/Vote.vue';
import WordLog from '~/components/game/WordLog.vue';
import GameInfo from '../GameInfo.vue';
import { useStore } from '~/store';
import type { LobbyGame, Lobby, Voted, GivingClue } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';

defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    voted: Voted | null;
    clue: GivingClue | null;
    timeRemaining: number;
    isReady: boolean;
}>();

defineEmits<GameStateEmits>();

const store = useStore();
</script>

<style scoped lang="scss">
.timer {
    margin-top: 16px;
    font-size: 1.2em;
}

.skip-wait {
    margin-top: 16px;
}

.cue-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;

    margin-bottom: 16px;

    .cue-giver {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .cue-text {
        font-size: 1.5rem;
        font-weight: bold;
    }
}
</style>
