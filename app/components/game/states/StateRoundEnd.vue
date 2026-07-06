<template>
    <div class="title">Round End</div>
    <div class="next-round">
        Next round starting in
        <span
            class="countdown"
            :class="{ 'countdown--low': timeRemaining <= 3 && timeRemaining > 0 }"
        >{{ timeRemaining }}s</span>
    </div>
    <word-log/>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import type { GameStateEmits } from '~~/types/game-state';

defineProps<{
    timeRemaining: number;
}>();

defineEmits<GameStateEmits>();
</script>

<style scoped lang="scss">
    .title {
        margin-bottom: 24px;

        font-size: 38px;
        font-weight: bold;
        text-align: center;

        animation: fade-up 0.35s $easeOutQuint both;

        @include mobile {
            font-size: 32px;
        }
    }

    .next-round {
        font-size: 14px;
        color: $lightgray150;
        text-align: center;
        animation: fade-up 0.35s $easeOutQuint 0.1s both;
    }

    .countdown {
        font-weight: bold;
        font-variant-numeric: tabular-nums;
        color: $lightgray50;
    }

    .countdown--low {
        color: $warning500;
        animation: countdown-pulse 1s ease-in-out infinite;
    }

    @keyframes fade-up {
        from {
            transform: translateY(8px);
            opacity: 0;
        }

        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes countdown-pulse {
        50% {
            opacity: 0.55;
        }
    }
</style>
