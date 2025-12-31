<template>
    <div class="common-page">
        <h1>{{ title }}</h1>
        <slot/>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
}>();

defineSlots<{
    default: () => any;
}>();
</script>

<style scoped lang="scss">
.common-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;

    padding: 32px;

    h1 {
        font-size: 2.5rem;
        font-weight: bold;
    }

    p {
        font-size: 1.25rem;
    }
}
</style>
