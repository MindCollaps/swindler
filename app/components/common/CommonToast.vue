<template>
    <transition name="slide-fade">
        <div
            v-if="isVisible"
            class="toast-container"
        >
            <div class="toast">
                <div class="toast-header">
                    <info-icon
                        v-if="type==='info'"
                        class="toast-icon toast-icon--info"
                    />
                    <warning-icon
                        v-else-if="type==='warning'"
                        class="toast-icon toast-icon--warning"
                    />
                    <error-icon
                        v-else-if="type==='error'"
                        class="toast-icon toast-icon--error"
                    />
                    <success-icon
                        v-else-if="type==='success'"
                        class="toast-icon toast-icon--success"
                    />

                    <strong class="toast-title">{{ title }}</strong>

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
                    v-if="$slots.default"
                    class="toast-content"
                >
                    <slot/>
                </div>
            </div>
        </div>
    </transition>
</template>


<script setup lang="ts">
import type { PropType } from 'vue';
import SuccessIcon from '../../../public/resources/success.svg?component';
import InfoIcon from '../../../public/resources/info.svg?component';
import WarningIcon from '../../../public/resources/warning.svg?component';
import ErrorIcon from '../../../public/resources/error.svg?component';

defineProps({
    type: {
        type: String as PropType<'success' | 'info' | 'warning' | 'error'>,
        default: 'info',
    },
    title: {
        type: String,
        default: 'Info',
    },
    isVisible: {
        type: Boolean,
    },
});

const emit = defineEmits({
    close() {
        return true;
    },
});

defineSlots<{
    default(): any;
}>();
</script>

<style scoped lang="scss">
    .toast-container {
        position: fixed;
        z-index: 9999;
        right: 2rem;
        bottom: 2rem;
    }

    .toast {
        display: flex;
        flex-direction: column;

        min-width: 300px;
        max-width: 400px;
        padding: 1rem 1.25rem;
        border-radius: 0.5rem;

        background: rgb(255 255 255 / 95%);
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%), 0 0 0 1px rgb(0 0 0 / 5%);

        &-header {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }

        &-title {
            flex: 1;
            font-size: 0.95rem;
            font-weight: 600;
            color: #1a1a1a;
        }

        &-icon {
            flex-shrink: 0;
            width: 1.5rem;
            height: 1.5rem;

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

            width: 1.5rem;
            height: 1.5rem;
            padding: 0;
            border: none;
            border-radius: 0.25rem;

            font-size: 1.5rem;
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
            margin-top: 0.5rem;
            padding-left: 2.25rem;
            font-size: 0.875rem;
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
