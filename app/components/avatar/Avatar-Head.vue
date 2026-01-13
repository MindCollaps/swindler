<template>
    <div
        class="head"
        :style="{
            '--size-x': sizeX,
            '--size-y': sizeY,
        }"
    >
        <a-part
            v-if="avatar?.hair && !placeHolder"
            class="hair"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'hair-' + avatar?.hair"
        />
        <a-part
            v-if="!placeHolder"
            class="eyes"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'eyes-' + avatar?.eyes"
        />
        <a-part
            v-if="!placeHolder"
            class="mouth"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'mouth-' + avatar?.mouth"
        />
        <a-part
            v-if="avatar?.accessory1"
            class="accessories"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'acc-' + avatar?.accessory1"
        />
        <a-part
            v-if="avatar?.accessory2"
            class="accessories"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'acc-' + avatar?.accessory2"
        />
        <a-part
            v-if="placeHolder"
            class="accessories"
            :size-x="sizeX"
            :size-y="sizeY"
            src="extra-1"
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
    placeHolder: Boolean,
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
