<template>
    Lobby ended!
    Thanks for playing!

    <word-log/>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import type { GameStateEmits } from '~~/types/game-state';

defineEmits<GameStateEmits>();
</script>
