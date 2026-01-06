<template>
    <div class="avatar" :style="{
            '--size-x': sizeX,
            '--size-y': sizeY,
        }">
        <a-head :avatar="avatar"/>
        <a-part
            class="skin"
            :src="'/resources/avatar/body-' + avatar?.body"
        />
        <a-part
            class="clothing"
            :src="'/resources/avatar/clothing-' + avatar?.clothing"
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
    rotate: 90deg;
}
</style>
