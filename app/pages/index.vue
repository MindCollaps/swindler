<template>
    <div class="home">
        <section class="hero">
            <div
                aria-hidden="true"
                class="hero-glow"
            />
            <div class="hero-content">
                <h1 class="hero-title">Swindler</h1>
                <p class="hero-tagline">Everyone gets a word. One of you doesn't. Trade clues, catch the Swindler, vote them out before the round ends.</p>
                <transition name="greeting-fade">
                    <p
                        v-if="store.me?.loggedIn"
                        class="hero-greeting"
                    >Welcome back, {{ store.me.username }}.</p>
                </transition>
                <common-button
                    class="hero-cta"
                    to="/lobby"
                >Play Swindler</common-button>
            </div>
        </section>

        <section
            aria-labelledby="how-heading"
            class="how"
        >
            <h2
                id="how-heading"
                class="how-heading"
            >How a round works</h2>
            <ol class="steps">
                <li class="step step--1">
                    <span
                        aria-hidden="true"
                        class="step-number"
                    >1</span>
                    <h3>Get your word</h3>
                    <p>Everyone at the table gets the same secret word — except the Swindler, who gets nothing and has to bluff.</p>
                </li>
                <li class="step step--2">
                    <span
                        aria-hidden="true"
                        class="step-number"
                    >2</span>
                    <h3>Drop a clue</h3>
                    <p>One word each, tied to the secret. Close enough to prove it, vague enough to stay safe.</p>
                </li>
                <li class="step step--3">
                    <span
                        aria-hidden="true"
                        class="step-number"
                    >3</span>
                    <h3>Vote them out</h3>
                    <p>Compare notes, call your suspect, and vote. Catch the Swindler and the table wins — miss, and they walk.</p>
                </li>
            </ol>
            <common-button
                class="how-cta"
                to="/lobby"
            >Ready? Play Swindler</common-button>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';

const store = useStore();
</script>

<style scoped lang="scss">
.home {
    display: flex;
    flex-direction: column;
    gap: 96px;
    align-items: center;

    max-width: 960px;
    margin: 0 auto;
    padding: 64px 32px 96px;

    @include mobile {
        gap: 56px;
        padding: 40px 20px 64px;
    }
}

// Hero

.hero {
    position: relative;

    display: flex;
    justify-content: center;

    width: 100%;
    padding: 24px;
}

.hero-glow {
    pointer-events: none;

    position: absolute;
    z-index: $z-decorative;
    inset: -40px 0 0;

    background: radial-gradient(closest-side, varToRgba('primary400', 0.22), transparent 70%);

    animation: glow-breathe 7s ease-in-out infinite;
}

.hero-content {
    position: relative;
    z-index: $z-decorative + 1;

    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;

    max-width: 640px;

    text-align: center;
}

.hero-title {
    margin: 0;

    font-size: clamp(2.75rem, 1.75rem + 4vw, 4.5rem);
    font-weight: 700;
    line-height: 1.05;
    color: $lightgray0;
    text-wrap: balance;
    letter-spacing: -0.02em;

    opacity: 0;

    animation: hero-rise 0.5s $easeOutQuart both;
}

.hero-tagline {
    max-width: 52ch;
    margin: 0;

    font-size: 18px;
    line-height: 1.6;
    color: $lightgray150;
    text-wrap: pretty;

    opacity: 0;

    animation: hero-rise 0.5s $easeOutQuart 0.08s both;

    @include mobile {
        font-size: 15px;
    }
}

.hero-greeting {
    margin: 0;
    font-size: 13px;
    color: $lightgray300;
}

.greeting-fade-enter-active,
.greeting-fade-leave-active {
    transition: opacity 0.3s $easeOutQuart, transform 0.3s $easeOutQuart;
}

.greeting-fade-enter-from,
.greeting-fade-leave-to {
    transform: translateY(-4px);
    opacity: 0;
}

.hero-cta {
    margin-top: 4px;
    opacity: 0;
    animation: hero-rise 0.5s $easeOutQuart 0.2s both;
}

@keyframes hero-rise {
    from {
        transform: translateY(14px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes glow-breathe {
    0%, 100% {
        opacity: 0.6;
    }

    50% {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .hero-title, .hero-tagline, .hero-cta {
        transform: none;
        opacity: 1;
        animation: none;
    }

    .hero-glow {
        opacity: 0.8;
        animation: none;
    }
}

// How it works

.how {
    display: flex;
    flex-direction: column;
    gap: 32px;
    align-items: center;

    width: 100%;
}

.how-heading {
    margin: 0;

    font-size: 30px;
    font-weight: 700;
    color: $lightgray0;
    text-align: center;
    text-wrap: balance;
    letter-spacing: -0.01em;

    @include mobile {
        font-size: 24px;
    }
}

.steps {
    display: grid;
    grid-template-areas:
        "one one"
        "two three";
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    width: 100%;
    margin: 0;
    padding: 0;

    list-style: none;

    @include mobile {
        grid-template-areas:
            "one"
            "two"
            "three";
        grid-template-columns: 1fr;
    }
}

.step {
    padding: 32px;
    border: 1px solid $darkgray600;
    border-radius: 8px;

    opacity: 0;
    background: $darkgray800;

    animation: hero-rise 0.5s $easeOutQuart both;

    @include mobile {
        padding: 24px;
    }

    h3 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: $lightgray50;
    }

    p {
        max-width: 60ch;
        margin: 0;

        font-size: 14px;
        line-height: 1.6;
        color: $lightgray150;
    }
}

.step--1 {
    grid-area: one;
    padding: 40px;
    animation-delay: 0.08s;

    @include mobile {
        padding: 24px;
    }
}

.step--2 {
    grid-area: two;
    animation-delay: 0.16s;
}

.step--3 {
    grid-area: three;
    animation-delay: 0.24s;
}

.step-number {
    user-select: none;

    display: block;

    margin-bottom: 8px;

    font-size: clamp(2.25rem, 3.5vw, 3rem);
    font-weight: 800;
    line-height: 1;
    color: $darkgray600;
}

@media (prefers-reduced-motion: reduce) {
    .step {
        opacity: 1;
        animation: none;
    }
}

.how-cta {
    margin-top: 8px;
}
</style>
