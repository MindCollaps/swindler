<template>
    <div class="toast">
        <div class="toast-header">
            <div
                v-if="toast.mode === ToastMode.Info"
                class="toast-icon toast-icon--info"
            >
                <Icon name="material-symbols:info"/>
            </div>

            <div
                v-else-if="toast.mode === ToastMode.Warning"
                class="toast-icon toast-icon--warning"
            >
                <Icon name="material-symbols:warning"/>
            </div>

            <div
                v-else-if="toast.mode === ToastMode.Error"
                class="toast-icon toast-icon--error"
            >
                <Icon name="material-symbols:error"/>
            </div>

            <div
                v-else-if="toast.mode === ToastMode.Success"
                class="toast-icon toast-icon--success"
            >
                <Icon name="material-symbols:check-circle"/>
            </div>

            <strong class="toast-title">{{ toast.title }}</strong>

            <button
                aria-label="Close"
                class="toast-close"
                type="button"
                @click="emit('close')"
            >
                ×
            </button>
        </div>
        <div
            v-if="toast.message"
            class="toast-content"
        >
            {{ toast.message }}
        </div>
    </div>
</template>


<script setup lang="ts">
import { ToastMode } from '~~/types/toast';
import type { Toast } from '~~/types/toast';

defineProps<{
    toast: Toast;
}>();

const emit = defineEmits<{
    close: [];
}>();
</script>

<style scoped lang="scss">
    .toast {
        display: flex;
        flex-direction: column;

        min-width: 300px;
        max-width: 400px;
        padding: 16px 20px;
        border-radius: 8px;

        background: rgb(255 255 255 / 95%);
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%), 0 0 0 1px rgb(0 0 0 / 5%);

        &-header {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        &-title {
            flex: 1;
            font-size: 15px;
            font-weight: 600;
            color: #1a1a1a;
        }

        &-icon {
            flex-shrink: 0;
            width: 24px;
            height: 24px;

            &--success {
                color: #22c55e;
            }

            &--error {
                color: #ef4444;
            }

            &--warning {
                color: #f59e0b;
            }

            &--info {
                color: #3b82f6;
            }
        }

        &-close {
            cursor: pointer;

            display: flex;
            flex-shrink: 0;
            align-items: center;
            justify-content: center;

            width: 24px;
            height: 24px;
            padding: 0;
            border: none;
            border-radius: 4px;

            font-size: 24px;
            font-weight: 300;
            line-height: 1;
            color: #6b7280;

            opacity: 0.7;
            background: transparent;

            transition: all 0.2s ease;

            &:hover {
                color: #1a1a1a;
                opacity: 1;
                background: rgb(0 0 0 / 5%);
            }
        }

        &-content {
            margin-top: 8px;
            padding-left: 36px;
            font-size: 14px;
            color: #4b5563;
        }
    }

    // Transition animations
    .slide-fade-enter-active {
        transition: all 0.3s ease-out;
    }

    .slide-fade-leave-active {
        transition: all 0.2s ease-in;
    }

    .slide-fade-enter-from {
        transform: translateX(-20px);
        opacity: 0;
    }

    .slide-fade-leave-to {
        transform: translateX(-20px);
        opacity: 0;
    }
</style>
