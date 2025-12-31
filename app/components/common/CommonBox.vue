<template>
    <div class="common-box-wrap">
        <div class="common-box">
            <slot/>
        </div>
    </div>
</template>

<script setup lang="ts">
defineSlots<{
    default: () => any;
}>();
</script>

<style scoped lang="scss">
.common-box-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;

    .common-box {
        display: flex;
        flex-direction: column;
        gap: 16px;

        min-width: 50vmax;
        padding: 32px;
        border: 1px solid $darkgray600;
        border-radius: 8px;

        background-color: $darkgray800;
    }
}
</style>
