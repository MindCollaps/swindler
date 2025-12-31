<template>
    <div class="app_content">
        <nuxt-loading-indicator :color="colorsList.primary300"/>
        <slot/>
        <div class="version">
            v{{ config.public.version }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { colorsList } from '#imports';

defineSlots<{ default: () => any }>();

const config = useRuntimeConfig();

useLayout();
</script>

<style lang="scss">
@use "~/scss/layout";

.version {
    pointer-events: none;

    position: fixed;
    z-index: 10000;
    right: 10px;
    bottom: 10px;

    font-size: 0.8rem;
    color: rgb(255, 255, 255, 0.3);
}
</style>
