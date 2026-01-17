<template>
    <div class="toast">
        <div class="toast-header">
            <div
                :class="`toast-icon toast-icon--${ toast.mode.toLowerCase() }`"
            >
                <Icon
                    :name="toastIcon[toast.mode]"
                    size="24px"
                />
            </div>

            <div class="toast-title">{{ toast.title }}</div>

            <button
                aria-label="Close"
                class="toast-close"
                type="button"
                @click="emit('close')"
            >
                <icon name="material-symbols:x-circle-outline"/>
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

const toastIcon = {
    [ToastMode.Info]: 'material-symbols:info',
    [ToastMode.Warning]: 'material-symbols:warning',
    [ToastMode.Error]: 'material-symbols:error',
    [ToastMode.Success]: 'material-symbols:check-circle',
};
</script>

<style scoped lang="scss">
    .toast {
        display: flex;
        flex-direction: column;

        min-width: 300px;
        max-width: 400px;
        padding: 16px 20px;
        border-radius: 8px;

        background: $lightgray50;
        box-shadow: 2px 2px 2px rgb(0,0,0, 0.25);

        &-header {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        &-title {
            flex: 1;
            font-size: 15px;
            font-weight: 600;
            color: $darkgray900;
        }

        &-icon {
            &--success {
                color: $success500;
            }

            &--error {
                color: $error500;
            }

            &--warning {
                color: $warning500;
            }

            &--info {
                color: $info500;
            }
        }

        &-close {
            cursor: pointer;

            display: flex;
            flex-shrink: 0;
            align-items: center;
            justify-content: center;

            width: 29px;
            height: 29px;
            padding: 4px;
            border: none;
            border-radius: 4px;

            font-size: 24px;
            font-weight: 300;
            line-height: 1;
            color: $darkgray700;

            opacity: 0.7;

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
            color: $darkgray800;
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
