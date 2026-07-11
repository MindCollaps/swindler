<template>
    <dev-only>
        {{ JSON.stringify(game) }}
        <br><br>
        {{ JSON.stringify(lobby) }}
        <br><br>
        {{ JSON.stringify(voted) }}
        <br><br>
    </dev-only>
    <game-info
        :game="game"
        :lobby="lobby"
        only-word
    />
    <transition
        mode="out-in"
        name="clue-fade"
    >
        <div
            :key="`${ clue?.player.id }-${ clue?.clue }`"
            class="cue-wrapper"
        >
            <div class="cue-giver">{{ clue?.player.username }}</div>
            <span class="cue-said">said</span>
            <div class="cue-text">{{ clue?.clue }}</div>
        </div>
    </transition>
    <vote :spectator="spectator"/>
    <div
        class="timer"
        :class="{ 'timer--low': timeRemaining <= 5 && timeRemaining > 0 }"
    >
        Time until continue: {{ timeRemaining }}s
    </div>
    <common-button
        v-if="!spectator"
        class="skip-wait"
        :disabled="isReady"
        primary-color="success500"
        width="100%"
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
import type { LobbyGame, Lobby, Voted, GivingClue } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';

defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    voted: Voted | null;
    clue: GivingClue | null;
    timeRemaining: number;
    isReady: boolean;
    spectator: boolean;
}>();

defineEmits<GameStateEmits>();
</script>

<style scoped lang="scss">
.timer {
    margin-top: 16px;
    font-size: 14px;
}

.timer--low {
    font-weight: bold;
    color: $warning500;
    animation: timer-pulse 1s ease-in-out infinite;
}

@keyframes timer-pulse {
    50% {
        opacity: 0.55;
    }
}

.skip-wait {
    margin-top: 16px;
}

.cue-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;

    margin-bottom: 16px;

    .cue-giver,
    .cue-text {
        min-width: 0;
        font-size: 24px;
        font-weight: bold;
        overflow-wrap: anywhere;
    }

    .cue-said {
        font-size: 14px;
        color: $lightgray300;
    }
}

.clue-fade-enter-active {
    transition: opacity 0.3s $easeOutQuint, transform 0.3s $easeOutQuint;
}

.clue-fade-leave-active {
    transition: opacity 0.15s $easeOutQuint;
}

.clue-fade-enter-from {
    transform: translateY(8px);
    opacity: 0;
}

.clue-fade-leave-to {
    opacity: 0;
}
</style>
