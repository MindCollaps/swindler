<template>
    <transition>
        <div
            v-if="isVisible"
            class="popup"
        >
            <div class="popup-content">
                <slot/>
                <div class="popup-control">
                    <common-button
                        icon="material-symbols:check-rounded"
                        :primary-color="submitColor"
                        type="primary"
                        @click="emit('submit')"
                    >
                        <template #default>
                            {{ submitText }}
                        </template>
                    </common-button>
                    <common-button
                        icon="material-symbols:close-rounded"
                        :primary-color="closeColor"
                        type="primary"
                        @click="emit('close')"
                    >
                        <template v-if="closeText">
                            {{ closeText }}
                        </template>
                    </common-button>
                </div>
            </div>
        </div>
    </transition>
</template>


<script setup lang="ts">
import type { PropType } from 'vue';

defineProps({
    type: {
        type: String as PropType<'default' | 'black' | 'transparent'>,
        default: 'default',
    },
    isVisible: {
        type: Boolean,
    },
    submitText: {
        type: String,
        default: 'Submit',
    },
    closeText: {
        type: String,
        default: 'Close',
    },
    submitColor: {
        type: String as PropType<ColorsList>,
        default: 'success500',
    },
    closeColor: {
        type: String as PropType<ColorsList>,
        default: 'error600',
    },
    submitIcon: {
        type: String,
    },
    closeIcon: {
        type: String,
    },
});

const emit = defineEmits({
    close() {
        return true;
    },
    submit() {
        return true;
    },
});

defineSlots<{
    default(): any;
}>();
</script>

<style scoped lang="scss">
.v-enter-active,
.v-leave-active {
    transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}

.popup {
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 100vw;
    height: 100vh;

    background: rgb(212, 238, 247, 0.1);

    &-content {
        padding: 32px;
        border-radius: 8px;
        background: $darkgray950;
    }

    &-control {
        display: flex;
        flex-flow: row;
        gap: 16px;
        align-items: center;
        justify-content: right;

        margin-top: 32px;
    }
}
</style>
