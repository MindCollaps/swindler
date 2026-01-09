<template>
    <div
        class="avatar-part"
        :style="style"
    />
</template>

<script lang="ts" setup>
import atlas from '~/utils/avatarAtlas.json';

const props = defineProps({
    sizeX: String,
    sizeY: String,
    src: String,
});

const style = computed(() => {
    if (!props.src) return {};

    // Format is "category-id"
    const match = props.src.match(/^([a-z]+)-(\d+)$/i);
    if (!match || !match[1] || !match[2]) return {};

    const category = match[1];
    const id = parseInt(match[2], 10);
    const part = (atlas.parts as any)[category]?.[id - 1];

    if (!part) return {};

    const denom = atlas.grid_size > 1 ? atlas.grid_size - 1 : 1;

    return {
        '--size-x': props.sizeX,
        '--size-y': props.sizeY,
        '--col': part.col,
        '--row': part.row,
        '--grid-size': atlas.grid_size,
        '--grid-denom': denom,
    };
});
</script>

<style scoped lang="scss">
.avatar-part {
    position: absolute;
    top: 0;
    left: 0;

    overflow: hidden;

    width: var(--size-x);
    height: var(--size-y);
}

.avatar-part::after {
    content: '';

    transform: translate(calc(var(--col) * -100% / var(--grid-size)), calc(var(--row) * -100% / var(--grid-size)));

    display: block;

    width: calc(var(--grid-size) * 100%);
    height: calc(var(--grid-size) * 100%);

    background-image: url('/resources/avatar-atlas.webp');
    background-repeat: no-repeat;
    background-size: 100% 100%;
}
</style>
