<template>
    <teleport to="body">
        <div
            v-for="(heart) in heartsInUse"
            :key="heart.id"
            ref="heartRefs"
            class="heart"
        >
            ❤️
        </div>
        <common-button
            class="heart-button"
            icon="material-symbols:favorite"
            icon-width="42px"
            type="transparent"
            @click="sendHeart()"
        />
    </teleport>
</template>

<script lang="ts" setup>
import { animate } from 'animejs';
import { useGameSocket } from '~/composables/sockets/game';

const route = useRoute();
const lobbyId = route.params.id as string;

const heartRefs = ref<HTMLElement[]>([]);
const heartsInUse = ref<{ id: number }[]>([]);
const freeHearts = ref<{ id: number }[]>([]);

const { addVote, gameSocket } = useGameSocket(lobbyId, { onHeart: animateHeart });

gameSocket.on('heart', () => {
    animateHeart();
});

function sendHeart() {
    addVote(4, true);
    animateHeart();
}

function animateHeart() {
    if (freeHearts.value.length === 0) return;
    const heart = freeHearts.value.at(0);
    if (!heart) return;

    freeHearts.value = freeHearts.value.filter(x => x.id !== heart.id);
    heartsInUse.value.push(heart);

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
                        heartsInUse.value = heartsInUse.value.filter(x => x.id !== heart.id);
                        freeHearts.value.push(heart);
                    }, 3000);
                },
            });
        }
    });
}

onMounted(() => {
    for (let i = 0; i < 30; i++) {
        freeHearts.value.push({ id: i });
    }
});
</script>

<style scoped lang="scss">
.heart {
    pointer-events: none;

    position: fixed;
    z-index: 1000;
    bottom: 3vh;
    left: 97vw;

    font-size: 2rem;
    color: #ff6b9d;

    opacity: 1;

    @include mobile {
        bottom: 3vh;
        left: 93vw;
    }
}

.heart-button {
    position: fixed;
    z-index: 1001;
    bottom: 3vh;
    left: 97vw;

    color: #ff6b9d;

    @include mobile {
        bottom: 4vh;
        left: 93vw;
    }
}
</style>
