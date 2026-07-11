<template>
    <div
        class="input"
        :class="{ 'input--focused': focused }"
    >
        <label
            v-if="$slots.default"
            class="input_label"
            :for="inputId"
        >
            <slot/>
        </label>
        <div
            class="input_container"
            :class="{ 'input_container--error': hasError }"
        >
            <div class="input__input">
                <Icon
                    v-if="icon"
                    class="input__input_icon"
                    :name="icon"
                />
                <input
                    :id="inputId"
                    ref="inputRef"
                    v-bind="inputAttrs"
                    v-model="model"
                    :aria-describedby="error ? errorId : undefined"
                    :aria-invalid="hasError"
                    :disabled="disabled"
                    :placeholder
                    :type="resolvedInputType"
                    @blur="focused = false"
                    @change="$emit('change', $event)"
                    @focus="focused = true"
                    @focusout="focused = false"
                    @input="$emit('input', $event)"
                >
                <button
                    v-if="isPasswordField && showPasswordToggle"
                    :aria-label="passwordRevealed ? 'Hide password' : 'Show password'"
                    :aria-pressed="passwordRevealed"
                    class="input__input_toggle"
                    type="button"
                    @click="passwordRevealed = !passwordRevealed"
                >
                    <Icon :name="passwordRevealed ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'"/>
                </button>
            </div>
        </div>
        <div
            v-if="error"
            :id="errorId"
            class="input_error"
            role="alert"
        >
            {{ error }}
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
    error: {
        type: String as PropType<string | null>,
        default: null,
    },
    showPasswordToggle: {
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
const inputId = useId();
const errorId = useId();

const passwordRevealed = ref(false);
const isPasswordField = computed(() => props.inputType === 'password');
const resolvedInputType = computed(() => isPasswordField.value && passwordRevealed.value ? 'text' : props.inputType);

const currentLength = computed(() => model.value?.length ?? 0);
const isLengthExceeded = computed(() => currentLength.value > props.maxInputLength);
const hasError = computed(() => !!props.error || (isLengthExceeded.value && props.inputLengthCheck));

defineExpose({
    input: inputRef,
});
</script>

<style scoped lang="scss">
.input {
    width: 100%;

    &_label {
        display: block;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 600;

        @include mobile {
            font-size: 10px;
        }
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

            @include mobile {
                font-size: 10px;
            }

            &::placeholder {
                color: varToRgba('lightgray150', 0.5);
                opacity: 1
            }

            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
                margin: 0;
                appearance: none;
            }

            &[type='number'] {
                appearance: textfield;
            }
        }

        &_toggle {
            cursor: pointer;

            display: flex;
            flex: none;
            align-items: center;
            justify-content: center;

            width: 20px;
            height: 20px;
            padding: 0;
            border: none;

            appearance: none;
            background: none;

            svg {
                width: 20px;
                height: 20px;
                fill: $lightgray400;
                transition: fill 0.3s;
            }

            &:hover svg, &:focus-visible svg {
                fill: $lightgray150;
            }

            &:focus-visible {
                outline: 2px solid $primary500;
                outline-offset: 2px;
            }
        }
    }

    &_error {
        margin-top: 8px;
        font-size: 12px;
        font-weight: 600;
        color: $error500;
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
