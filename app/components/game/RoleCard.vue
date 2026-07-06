<template>
    <button
        :aria-label="open ? undefined : 'Hold to peek at your role'"
        :aria-pressed="open"
        class="role-card"
        :class="{ 'role-card--open': open }"
        type="button"
        @blur="open = false"
        @contextmenu.prevent
        @keydown="onKeyDown"
        @keyup="onKeyUp"
        @pointercancel="open = false"
        @pointerdown.prevent="open = true"
        @pointerleave="open = false"
        @pointerup="open = false"
    >
        <span
            v-if="!open"
            class="role-card_back"
        >
            <Icon
                class="role-card_eye"
                name="material-symbols:visibility-outline"
            />
            <span>Hold to peek</span>
        </span>
        <span
            v-else
            class="role-card_face"
        >
            <template v-if="game?.imposter">
                <span class="role-card_role">You are the Swindler</span>
                <span class="role-card_hint">Blend in.</span>
            </template>
            <template v-else-if="game?.word?.word">
                <span class="role-card_word">{{ game.word.word }}</span>
                <span
                    v-if="game.word.wordListName"
                    class="role-card_hint"
                >({{ game.word.wordListName }})</span>
            </template>
            <template v-else>
                <span class="role-card_hint">You're spectating</span>
            </template>
        </span>
    </button>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { LobbyGame } from '~~/types/redis';

defineProps({
    game: Object as PropType<LobbyGame | null>,
});

const open = ref(false);

function onKeyDown(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        open.value = true;
    }
}

function onKeyUp(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
        open.value = false;
    }
}
</script>

<style scoped lang="scss">
.role-card {
    cursor: pointer;
    user-select: none;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    min-height: 104px;
    padding: 16px;
    border: 1px solid $darkgray600;
    border-radius: 8px;

    font-family: $defaultFont;
    color: $lightgray300;
    text-align: center;

    appearance: none;
    background: $darkgray900;

    transition: background 0.15s $easeOutQuart, transform 0.15s $easeOutQuart;

    -webkit-touch-callout: none;

    &:focus-visible {
        outline: 2px solid $primary500;
        outline-offset: 2px;
    }

    &--open {
        transform: scale(0.99);
        background: $darkgray875;
    }
}

.role-card_back {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    font-size: 13px;
    font-weight: 600;
}

.role-card_eye {
    width: 24px;
    height: 24px;
}

.role-card_face {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    animation: peek-in 0.12s $easeOutQuart both;
}

.role-card_word {
    font-size: 32px;
    font-weight: bold;
    color: $lightgray50;
    overflow-wrap: anywhere;

    @include mobile {
        font-size: 24px;
    }
}

.role-card_role {
    font-size: 24px;
    font-weight: bold;
    color: $warning500;
}

.role-card_hint {
    font-size: 13px;
    color: $lightgray300;
}

@keyframes peek-in {
    from {
        opacity: 0;
    }
}
</style>
