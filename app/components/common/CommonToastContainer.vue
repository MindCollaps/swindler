<template>
    <div class="toast-container">
        <transition-group name="toast-list">
            <common-toast
                v-for="(toast, index) in toasts"
                :key="toast.id"
                class="toast-item"
                :style="{ bottom: `${ index * 110 + 20 }px` }"
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
}

.toast-item {
    position: fixed;
    right: 32px;
    transition: bottom 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
}

// Transition group animations
.toast-list-enter-active {
    transition: all 0.3s ease;
}

.toast-list-leave-active {
    transition: all 0.3s ease;
}

.toast-list-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.toast-list-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

.toast-list-move {
    transition: all 0.3s ease;
}
</style>
