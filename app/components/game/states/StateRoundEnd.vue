<template>
    <div class="title">Round End</div>
    Next round starting in {{ timeRemaining }}s
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
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
    }
</style>
