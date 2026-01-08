<template>
    <common-button
        :icon="right ? 'material-symbols:chevron-right' : 'material-symbols:chevron-left'"
        icon-width="30px"
        type="transparent"
        @click="$emit('click', $event)"
    />
</template>

<script lang="ts" setup>
import CommonButton from './CommonButton.vue';

defineProps({
    right: Boolean,
});

defineEmits({
    click(e: MouseEvent) {
        return true;
    },
});
</script>
