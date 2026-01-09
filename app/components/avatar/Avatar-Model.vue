<template>
    <div class="avatar" v-if="avatar" :style="{
        '--size-x': sizeX,
        '--size-y': sizeY,
    }">
        <a-head :avatar="avatar" :size-x="sizeX" :size-y="sizeY" />
        <a-part class="skin" :size-x="sizeX" :size-y="sizeY" :src="'body-' + avatar.body" />
        <a-part class="clothing" :size-x="sizeX" :size-y="sizeY" :src="'cloth-' + avatar.cloth" />
    </div>
    <div v-else class="avatar" :style="{
        '--size-x': sizeX,
        '--size-y': sizeY,
    }">
         <a-head
            :avatar="placeholderAvatar"
            :size-x="sizeX"
            :size-y="sizeY"
            place-holder
        />
        <a-part
            class="skin"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'body-' + placeholderAvatar.body"
        />
        <a-part
            class="clothing"
            :size-x="sizeX"
            :size-y="sizeY"
            :src="'cloth-' + placeholderAvatar.cloth"
        />
    </div>
</template>

<script lang="ts" setup>
import APart from './Avatar-Part.vue';
import AHead from './Avatar-Head.vue';
import type { Avatar } from '~~/types/data';

const placeholderAvatar: Ref<Avatar> = ref({
    body: 1,
    eyes: 1,
    cloth: 1,
    mouth: 1,
    hair: undefined,
    accessory1: undefined,
    accessory2: undefined,
});

defineProps({
    avatar: Object as PropType<Avatar | undefined>,
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
