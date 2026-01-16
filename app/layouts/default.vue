<template>
    <div class="app">
        <div
            class="header"
        >
            <div class="header-text">
                Swindler
            </div>
            <view-menu/>
            <connection-client/>
            <view-login/>
        </div>
        <div class="app_content">
            <nuxt-loading-indicator :color="colorsList.primary300"/>
            <slot/>
        </div>
        <div class="version">
            v{{ config.public.version }}
        </div>
    </div>
</template>

<script setup lang="ts">
import ViewMenu from '~/components/views/ViewMenu.vue';
import ViewLogin from '~/components/views/ViewLogin.vue';
import { colorsList } from '#imports';

defineSlots<{ default: () => any }>();

const config = useRuntimeConfig();

useLayout();
</script>

<style lang="scss">
@use "~/scss/layout";
</style>

<style scoped lang="scss">
.version {
    pointer-events: none;

    position: fixed;
    z-index: 10000;
    right: 10px;
    bottom: 10px;

    font-size: 0.8rem;
    color: rgb(255, 255, 255, 0.3);
}

.header {
    position: sticky;

    display: grid;
    grid-template-columns: 0.5fr 2fr 15px 0.3fr;
    gap: 12px;
    align-items: center;

    width: 100%;
    padding: 9px;

    background: $darkgray1000;

    &-text {
        display: flex;
        align-items: center;
        justify-content: start;

        margin-left: 24px;

        font-size: 24px;
    }

    &-container {
        display: flex;
        gap: 100px;
        align-items: center;
    }
}
</style>
