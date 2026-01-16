<template>
    <div class="app_content">
        <nuxt-loading-indicator :color="colorsList.primary300"/>
        <slot/>
        <common-toast-container/>
        <div class="version">
            v{{ config.public.version }}
        </div>
        <view-version/>
    </div>
</template>

<script setup lang="ts">
import { colorsList } from '#imports';
import ViewVersion from '~/components/views/ViewVersion.vue';

defineSlots<{ default: () => any }>();

useLayout();
</script>

<style lang="scss">
@use "~/scss/layout";
</style>
