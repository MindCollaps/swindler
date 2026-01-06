<template>
    <div class="head" :style="{
            '--size-x': sizeX,
            '--size-y': sizeY,
        }">
        <a-part
            v-if="avatar?.hair"
            class="hair"
            :src="'/resources/avatar/hair-' + avatar?.hair"
        />
        <a-part
            class="face"
            :src="'/resources/avatar/face-' + avatar?.face"
        />
    </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import APart from './Avatar-Part.vue';
import type { Avatar } from '~~/types/data';

defineProps({
    avatar: Object as PropType<Avatar>,
      sizeX: String,
    sizeY: String,
});
</script>

<style scoped lang="scss">
.head {
    position: absolute;
    z-index: 100;
     width: var(--size-x);
    height: var(--size-y);
}
</style>
