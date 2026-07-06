<template>
    <div
        class="idle"
        role="status"
    >
        <common-loader smol/>
        <p>Waiting for game to start...</p>
    </div>
</template>

<script setup lang="ts">
import type { GameStateEmits } from '~~/types/game-state';

defineEmits<GameStateEmits>();
</script>

<style scoped lang="scss">
.idle {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;

    padding: 64px 16px;

    color: $lightgray150;
}
</style>
