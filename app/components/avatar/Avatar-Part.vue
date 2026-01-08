<template>
    <div
        class="avatar-part"
        :style="style"
    />
</template>

<script lang="ts" setup>
import atlas from '~/utils/avatarAtlas.json';

const props = defineProps({
    x: Number,
    y: Number,
    sizeX: String,
    sizeY: String,
    src: String,
});

const style = computed(() => {
    if (!props.src) return {};

    // specific handling to support legacy paths if any, though we will update callers
    const cleanSrc = props.src.split('/').pop()?.replace('.png', '') || '';
    // Format is "category-id"
    const match = cleanSrc.match(/^([a-z]+)-(\d+)$/);
    if (!match || !match[1] || !match[2]) return {};

    const category = match[1];
    const id = parseInt(match[2], 10);
    // 1-based index support
    const part = (atlas.parts as any)[category]?.[id - 1];

    if (!part) return {};

    const denom = atlas.grid_size > 1 ? atlas.grid_size - 1 : 1;

    return {
        '--offset-x': props.x || 0,
        '--offset-y': props.y || 0,
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
    top: var(--offset-y)px;
    left: var(--offset-x)px;

    width: var(--size-x);
    height: var(--size-y);

    background-image: url('/resources/avatar-atlas.webp');
    background-repeat: no-repeat;
    // Percentage derived position: i / (n-1) * 100%
    background-position: calc(var(--col) / var(--grid-denom) * 100%) calc(var(--row) / var(--grid-denom) * 100%);
    background-size: calc(var(--grid-size) * 100%) calc(var(--grid-size) * 100%);
}
</style>
