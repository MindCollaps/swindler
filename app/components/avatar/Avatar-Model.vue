<template>
    <div
        class="avatar"
        :style="{
            '--size-x': sizeX,
            '--size-y': sizeY,
        }"
    >
        <a-head
            :avatar="avatar"
            :size-x="sizeX"
            :size-y="sizeY"
        />
        <a-part
            class="skin"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'body-' + avatar?.body"
        />
        <a-part
            class="clothing"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'cloth-' + avatar?.cloth"
        />
    </div>
</template>

<script lang="ts" setup>
import APart from './Avatar-Part.vue';
import AHead from './Avatar-Head.vue';
import type { Avatar } from '~~/types/data';

defineProps({
    avatar: Object as PropType<Avatar>,
    sizeX: String,
    sizeY: String,
});
</script>

<style scoped lang="scss">
.avatar {
    position: absolute;
    width: var(--size-x);
    height: var(--size-y);
}
</style>
