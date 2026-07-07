<template>
    <div class="version">
        v{{ config.public.version }}
    </div>
</template>

<script lang="ts" setup>
const config = useRuntimeConfig();
</script>

<style scoped lang="scss">
.version {
    pointer-events: none;

    position: fixed;
    z-index: $z-chrome;
    right: 10px;
    bottom: 10px;

    font-size: 0.8rem;
    color: $lightgray400;
}
</style>
