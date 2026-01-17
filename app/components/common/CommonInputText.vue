<template>
    <div
        class="input"
        :class="{ 'input--focused': focused }"
    >
        <div
            v-if="$slots.default"
            class="input_label"
        >
            <slot/>
        </div>
        <div
            class="input_container"
            :class="{ 'input_container--error': isLengthExceeded && inputLengthCheck }"
        >
            <label class="input__input">
                <Icon
                    v-if="icon"
                    class="input__input_icon"
                    :name="icon"
                />
                <input
                    ref="inputRef"
                    v-bind="inputAttrs"
                    v-model="model"
                    :disabled="disabled"
                    :placeholder
                    :type="inputType"
                    @blur="focused = false"
                    @change="$emit('change', $event)"
                    @focus="focused = true"
                    @focusout="focused = false"
                    @input="$emit('input', $event)"
                >
            </label>
        </div>
        <div
            v-if="inputLengthCheck"
            class="input_counter"
            :class="{ 'input_counter--exceeded': isLengthExceeded }"
        >
            {{ currentLength }} / {{ maxInputLength }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { WordSettings } from '~~/types/word';


const props = defineProps({
    inputAttrs: {
        type: Object as PropType<Record<string, any>>,
        default: () => {},
    },
    inputType: {
        type: String,
        default: 'text',
    },
    height: {
        type: String,
    },
    placeholder: {
        type: String,
    },
    disabled: {
        type: Boolean,
    },
    icon: {
        type: String,
    },
    maxInputLength: {
        type: Number, // todo: has to be greater than 1
        default: WordSettings.MAXLENGTH,
    },
    inputLengthCheck: {
        type: Boolean,
        default: false,
    },
});

defineEmits({
    input(event: Event) {
        return true;
    },
    change(event: Event) {
        return true;
    },
});

defineSlots<{ default?: () => string }>();

const focused = defineModel('focused', { type: Boolean });
const model = defineModel({ type: String, default: null });

const inputRef = ref<HTMLInputElement | null>(null);

const currentLength = computed(() => model.value?.length);
const isLengthExceeded = computed(() => currentLength.value > props.maxInputLength);

defineExpose({
    input: inputRef,
});
</script>

<style scoped lang="scss">
.input {
    width: 100%;

    &_label {
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 600;
    }

    &_container {
        display: flex;
        gap: 16px;
        align-items: center;

        width: 100%;
        height: v-bind(height);
        padding: 0 16px;
        border: 2px solid transparent;
        border-radius: 8px;

        background: $darkgray900;

        transition: 0.3s;

        @include hover {
            &:hover {
                border-color: $darkgray800;
            }
        }
    }

    &--focused .input_container {
        border-color: $primary500
    }

    &_container--error {
        border-color: $error500 !important;
    }

    &__input {
        display: flex;
        gap: 12px;
        align-items: center;
        width: 100%;

        input {
            width: 100%;
            padding: 12px 0;
            border: none;

            font-family: $defaultFont;
            font-size: 13px;
            font-weight: 600;
            color:$lightgray150;

            appearance: none;
            background: none;
            outline: none;
            box-shadow: none;

            &::placeholder {
                color: varToRgba('lightgray150', 0.5);
                opacity: 1
            }
        }
    }

    &_counter {
        margin-top: 4px;
        margin-bottom: 10px;

        font-size: 11px;
        color: $lightgray400;
        text-align: right;

        &--exceeded {
            font-weight: 700;
            color: $error500;
        }
    }
}
</style>
