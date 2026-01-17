<template>
    <div class="toast-container">
        <transition-group name="toast-list">
            <common-toast
                v-for="(toast, index) in toasts"
                :key="toast.id"
                class="toast-item"
                :style="{ bottom: `${ (toasts.length - index - 1) * 100 + 32 }px` }"
                :toast="toast"
                @close="store.removeToast(toast.id)"
            />
        </transition-group>
    </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore } from '~/store';

const store = useStore();
const { toasts } = storeToRefs(store);
</script>

<style scoped lang="scss">
.toast-container {
    position: fixed;
    z-index: 9999;
    right: 32px;
    bottom: 0;

    display: flex;
    flex-direction: column;
    gap: 12px;
}

.toast-item {
    position: fixed;
    right: 32px;
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-list-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.toast-list-leave-to {
    transform: translateX(300px);
    opacity: 0;
}
</style>
