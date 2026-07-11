<template>
    <teleport to="body">
        <div
            ref="dealRef"
            aria-label="Your role for this game"
            aria-modal="true"
            class="role-deal"
            :class="{ 'role-deal--leaving': leaving }"
            role="dialog"
            tabindex="-1"
            @click.self="closeFromBackdrop"
            @keydown.esc.prevent="close"
        >
            <div class="role-deal_game">Game {{ gameNumber }}</div>

            <div
                v-if="imposter"
                class="role-deal_content"
            >
                <div class="role-deal_role">You are the Swindler</div>
                <div class="role-deal_hint">Blend in. Guess the word.</div>
            </div>
            <div
                v-else
                class="role-deal_content"
            >
                <div class="role-deal_word">{{ word }}</div>
                <div
                    v-if="wordListName"
                    class="role-deal_list"
                >({{ wordListName }})</div>
                <div class="role-deal_hint">You know the word. Don't give it away.</div>
            </div>

            <div class="role-deal_footer">
                <div class="role-deal_dismiss">Tap anywhere to hide</div>
                <div class="role-deal_progress"><span class="role-deal_progress-bar"/></div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
defineProps<{
    imposter: boolean;
    word?: string;
    wordListName?: string;
    gameNumber?: number;
}>();

const emit = defineEmits<{
    (e: 'dismiss'): void;
}>();

const dealRef = ref<HTMLElement | null>(null);
const leaving = ref(false);
const canBackdropDismiss = ref(false);
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let leaveTimeout: ReturnType<typeof setTimeout> | null = null;
let backdropGraceTimeout: ReturnType<typeof setTimeout> | null = null;

function close() {
    if (leaving.value) return;
    leaving.value = true;
    leaveTimeout = setTimeout(() => emit('dismiss'), 180);
}

function closeFromBackdrop() {
    if (!canBackdropDismiss.value) return;
    close();
}

onMounted(() => {
    dealRef.value?.focus();
    backdropGraceTimeout = setTimeout(() => {
        canBackdropDismiss.value = true;
    }, 300);
    hideTimeout = setTimeout(close, 5000);
});

onUnmounted(() => {
    if (backdropGraceTimeout) clearTimeout(backdropGraceTimeout);
    if (hideTimeout) clearTimeout(hideTimeout);
    if (leaveTimeout) clearTimeout(leaveTimeout);
});
</script>

<style scoped lang="scss">
.role-deal {
    cursor: pointer;
    user-select: none;

    position: fixed;
    z-index: $z-overlay-top;
    inset: 0;

    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;
    justify-content: center;

    padding: 32px;

    text-align: center;

    // Opaque on purpose: the role must not be readable through the backdrop.
    background: $darkgray1000;
    outline: none;

    transition: opacity 0.18s $easeOutQuint;
    animation: deal-in 0.2s $easeOutQuint both;

    &--leaving {
        pointer-events: none;
        opacity: 0;
    }
}

.role-deal_game {
    font-size: 13px;
    font-weight: 600;
    color: $lightgray300;
}

.role-deal_content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}

.role-deal_word {
    font-size: 56px;
    font-weight: bold;
    color: $lightgray50;
    animation: deal-word 0.6s $easeOutQuint 0.15s both;

    @include mobile {
        font-size: 40px;
    }
}

.role-deal_role {
    font-size: 40px;
    font-weight: bold;
    color: $warning500;
    animation: deal-word 0.6s $easeOutQuint 0.15s both;

    @include mobile {
        font-size: 32px;
    }
}

.role-deal_list {
    font-size: 13px;
    color: $lightgray300;
    animation: deal-line 0.4s $easeOutQuint 0.4s both;
}

.role-deal_hint {
    font-size: 14px;
    color: $lightgray150;
    animation: deal-line 0.4s $easeOutQuint 0.55s both;
}

.role-deal_footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;

    width: min(280px, 70vw);

    animation: deal-line 0.4s $easeOutQuint 0.7s both;
}

.role-deal_dismiss {
    font-size: 13px;
    color: $lightgray300;
}

.role-deal_progress {
    overflow: hidden;

    width: 100%;
    height: 2px;
    border-radius: 999px;

    background: $darkgray800;
}

.role-deal_progress-bar {
    transform-origin: left;

    display: block;

    width: 100%;
    height: 100%;

    background: $primary500;

    animation: deal-countdown 5s linear both;
}

@keyframes deal-in {
    from {
        opacity: 0;
    }
}

@keyframes deal-word {
    from {
        transform: translateY(6px);
        opacity: 0;
        clip-path: inset(0 100% 0 0);
    }

    to {
        transform: translateY(0);
        opacity: 1;
        clip-path: inset(0 0 0 0);
    }
}

@keyframes deal-line {
    from {
        transform: translateY(6px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes deal-countdown {
    to {
        transform: scaleX(0);
    }
}
</style>
