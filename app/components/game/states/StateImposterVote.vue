<template>
    <div
        v-if="!game?.imposter"
        class="guess"
    >
        <div
            v-if="!game?.imposter"
            class="word"
        >
            Word: {{ game?.word?.word }}
        </div>
        The Imposter thinks '{{ game?.imposterGuess?.toLowerCase() }}' is the word.
    </div>
    <div v-else>
        You think '{{ game?.imposterGuess?.toLowerCase() }}' is the word.
    </div>
</template>

<script setup lang="ts">
import type { LobbyGame } from '~~/types/redis';

defineProps<{
    game: LobbyGame | null;
}>();
</script>

<style scoped lang="scss">
    .guess {
        padding: 32px;
        font-size: 1.5rem;
    }

    .word {
        display: flex;
        align-items: center;
        justify-content: center;

        margin-bottom: 16px;

        font-size: 1.2rem;
        font-weight: bold;
        text-align: center;
    }
</style>
