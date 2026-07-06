<template>
    <div
        v-if="!game?.imposter"
        class="guess"
    >
        <div
            v-if="!spectator"
            class="word"
        >
            Word: {{ game?.word?.word }}
        </div>
        The Imposter thinks '{{ game?.imposterGuess?.toLowerCase() }}' is the word.
    </div>
    <div
        v-else
        class="guess"
    >
        You think '{{ game?.imposterGuess?.toLowerCase() }}' is the word.
    </div>
</template>

<script setup lang="ts">
import type { LobbyGame } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';

defineProps<{
    game: LobbyGame | null;
    spectator: boolean;
}>();

defineEmits<GameStateEmits>();
</script>

<style scoped lang="scss">
    .guess {
        padding: 32px;
        font-size: 24px;
        animation: guess-reveal 0.4s $easeOutQuint 0.2s both;
    }

    @keyframes guess-reveal {
        from {
            transform: translateY(8px);
            opacity: 0;
        }

        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .word {
        display: flex;
        align-items: center;
        justify-content: center;

        margin-bottom: 16px;

        font-size: 14px;
        font-weight: bold;
        text-align: center;
    }
</style>
