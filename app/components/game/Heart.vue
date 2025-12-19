<template>
    <teleport to="body">
        <div
            v-for="(heart) in hearts"
            :key="heart.id"
            ref="heartRefs"
            class="heart"
        >
            ❤️
        </div>
    </teleport>
</template>

<script lang="ts" setup>
import { animate } from 'animejs';
import { useGameSocket } from '~/composables/sockets/game';

const route = useRoute();
const lobbyId = route.params.id as string;

const hearts = ref<{ id: number }[]>([]);
const heartRefs = ref<HTMLElement[]>([]);

useGameSocket(lobbyId, { onHeart: animateHeart });

function animateHeart() {
    console.log('heart');
    const id = Date.now();
    hearts.value.push({ id: id });

    nextTick(() => {
        const heartEl = heartRefs.value[heartRefs.value.length - 1];
        if (heartEl) {
            const randomX = -20 - (Math.random() * 20);
            const randomY = -50 - (Math.random() * 20);
            animate(heartEl, {
                translateX: `${ randomX }vw`,
                translateY: `${ randomY }vh`,
                scale: 0.3,
                opacity: 0,
                duration: 3000,
                easing: 'easeOutQuad',
                complete: () => {
                    setTimeout(() => {
                        hearts.value.shift();
                    }, 3000);
                },
            });
        }
    });
}
</script>
