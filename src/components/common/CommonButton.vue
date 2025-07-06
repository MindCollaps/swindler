<template>
    <component
        :is="getTag"
        class="button"
        :class="[
            `button--type-${ type }`,
            `button--size-${ size }`,
            `button--orientation-${ orientation }`,
            {
                'button--disabled': disabled,
                'button--icon': !!$slots.icon && !$slots.default,
            },
        ]"
        :style="{
            '--button-width': width ?? 'auto',
            '--icon-width': iconWidth,
            '--primary-color': colorsList[primaryColor],
            '--link-color': colorsList[linkColor],
            '--icon-color': colorsList[iconColor],
            '--hover-color': colorsList[hoverColor],
            '--focus-color': colorsList[focusColor],
            '--text-align': textAlign,
        }"
        :target="target"
        v-bind="getAttrs"
        @click="!disabled && $emit('click', $event)"
    >
        <Icon
            v-if="icon"
            class="button_icon"
            :name="icon"
        />
        <div
            v-if="$slots.default"
            class="button_content"
        >
            <slot name="default"/>
        </div>
    </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { NuxtLink } from '#components';
import type { ColorsList } from '~/utils/styles';
import { colorsList } from '~/utils/styles';

const props = defineProps({
    tag: {
        type: String,
    },
    width: {
        type: String,
    },
    iconWidth: {
        type: String,
        default: '20px',
    },
    type: {
        type: String as PropType<'primary' | 'secondary' | 'secondary-875' | 'secondary-flat' | 'link' | 'transparent'>,
        default: 'primary',
    },
    orientation: {
        type: String as PropType<'vertical' | 'horizontal'>,
        default: 'horizontal',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    size: {
        type: String as PropType<'M' | 'S'>,
        default: 'M',
    },
    href: {
        type: String,
        default: null,
    },
    target: {
        type: String,
        default: null,
    },
    to: {
        type: [String, Object] as PropType<RouteLocationRaw | string | null | undefined>,
        default: null,
    },
    primaryColor: {
        type: String as PropType<ColorsList>,
        default: 'primary400',
    },
    linkColor: {
        type: String as PropType<ColorsList>,
        default: 'lightgray150',
    },
    iconColor: {
        type: String as PropType<ColorsList>,
        default: 'lightgray150',
    },
    icon: {
        type: String,
    },
    hoverColor: {
        type: String as PropType<ColorsList>,
        default: 'primary200',
    },
    focusColor: {
        type: String as PropType<ColorsList>,
        default: 'primary600',
    },
    textAlign: {
        type: String,
        default: 'center',
    },
});

defineEmits({
    click(e: MouseEvent) {
        return true;
    },
});

defineSlots<{
    default?(): any;
}>();

const getTag = computed(() => {
    if (props.disabled) return props.tag ?? 'div';
    if (props.href) return 'a';
    if (props.to) return NuxtLink;
    return props.tag ?? 'div';
});

const getAttrs = computed(() => {
    const attrs: Record<string, any> = {};
    if (props.to) {
        attrs.to = props.to;
        attrs.noPrefetch = true;
    }
    else if (props.href) attrs.href = props.href;

    return attrs;
});
</script>

<style scoped lang="scss">
.button {
    cursor: pointer;
    user-select: none;

    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;

    width: var(--button-width);
    min-height: 40px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;

    font-family: $defaultFont;
    font-size: 14px;
    font-weight: 600;
    color: $lightgray50Orig;
    text-align: var(--text-align);
    text-decoration: none;

    appearance: none;
    background: var(--primary-color);
    outline: none;
    box-shadow: 2px 2px 2px rgb(0,0,0, 0.25);

    &_content {
        width: 100%;
        min-width: max-content;
    }

    @include pc {
        transition: 0.3s;

        &:hover {
            background: var(--hover-color);
        }
    }

    &_icon {
        display: flex;
        justify-content: center;

        width: var(--icon-width);
        min-width: var(--icon-width);
        height: var(--icon-width);
        min-height: var(--icon-width);

        fill: var(--icon-color);
    }

    &--type-secondary, &--type-secondary-flat, &--type-secondary-875 {
        color: $lightgray50;
        background: $darkgray900;
    }

    &--type-secondary-875 {
        background: $darkgray875;
    }

    &--type-secondary, &--type-secondary-875 {
        @include hover {
            &:hover {
                background: $darkgray850;
            }

            &:focus, &:active {
                background: $darkgray800;
            }
        }
    }

    &--type-secondary-flat {
        @include hover {
            &:hover {
                color: $primary500;
                background: $darkgray900;
            }

            &:focus, &:active {
                color: $primary500;
                background: $darkgray900;
            }
        }
    }

    &--type-transparent {
        color: $lightgray150;
        background: transparent;
        box-shadow: none;

        .button_icon {
            fill: $lightgray150;
        }

        @include hover {
            &:hover {
                color: $primary500;
                background: $darkgray800;
            }
        }
    }

    &--orientation-vertical {
        flex-direction: column;
        text-align: center;
    }

    &--icon {
        width: 40px;
        height: 40px;
        padding: 8px;
    }

    &--size-S {
        min-height: 32px;

        &.button--icon {
            width: 32px;
            height: 32px;
        }
    }

    &--type-link {
        justify-content: flex-start;

        height: auto;
        min-height: auto;
        padding: 0;
        border-radius: 0;

        font-size: 10px;
        color: var(--link-color);
        text-align: left;
        text-decoration: underline;

        background: transparent !important;

        @include hover {
            &:hover {
                color: var(--hover-color);
            }

            &:focus, &:active {
                color: var(--focus-color);
            }
        }
    }

    &--disabled {
        opacity: 0.5;

        &, &:deep(svg) {
            pointer-events: none;
            cursor: default;
        }
    }
}
</style>
