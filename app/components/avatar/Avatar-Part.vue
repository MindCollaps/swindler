<template>
    <nuxt-img
        class="avatar-part"
        :src="src + '.png'"
        :style="{
            '--offset-x': x,
            '--offset-y': y,
            '--size-x': sizeX,
            '--size-y': sizeY,
        }"
    />
</template>

<script lang="ts" setup>
defineProps({
    x: Number,
    y: Number,
    sizeX: String,
    sizeY: String,
    src: String,
});
</script>

<style scoped lang="scss">
.avatar-part {
    position: absolute;
    top: var(--offset-y)px;
    left: var(--offset-x)px;
    width: var(--size-x);
    height: var(--size-y);
}
</style>
