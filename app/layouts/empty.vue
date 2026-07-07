<template>
    <div>
        <a
            class="skip-link"
            href="#main-content"
        >Skip to content</a>
        <main
            id="main-content"
            class="app_content"
        >
            <client-only>
                <nuxt-loading-indicator :color="colorsList.primary300"/>
            </client-only>
            <slot/>
            <common-toast-container/>
            <view-version/>
        </main>
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
