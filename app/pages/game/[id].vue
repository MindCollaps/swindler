<template>
    <div v-if="connected">
        Round: {{ game?.round }}
        <div v-if="myTurn">
            Your Turn
        </div>
        <div v-else>
            {{ turnName }}'s turn
        </div>
        <br>
        Imposter: {{ game?.imposter ? 'yes' : 'no' }}
        <br>
        <div v-if="!game?.imposter">
            Word: {{ game?.word?.word }}
        </div>
        <br>
        Players
        <div>
            <div
                v-for="player in lobby?.players"
                :key="player.id"
            >
                {{ player.username }}
            </div>
        </div>
        <div v-if="myTurn">
            <common-input-text
                v-model="clue"
                @keyup.enter="sendClue"
            >Clue</common-input-text>
            <common-button @click="sendClue">Send</common-button>
        </div>
        <br>
        <br>
        <div>
            <common-button
                :disabled="myTurn"
                @click="vote(1)"
            >😖 {{ voted?.down === 0 || !voted?.down ? undefined :
                voted.down }}</common-button>
            <common-button
                :disabled="myTurn"
                @click="vote(2)"
            >🥰 {{ voted?.up === 0 || !voted?.up ? undefined : voted.up
            }}</common-button>
            <common-button
                :disabled="myTurn"
                @click="vote(3)"
            >🕵️ {{ voted?.imposter === 0 || !voted?.imposter ?
                undefined : voted.imposter }}</common-button>
            <common-button @click="vote(4)">❤️</common-button>
        </div>
        <br>
        <br>
        <br>
        <div v-if="animateClue">
            {{ clueGiven?.player.username }} said {{ clueGiven?.clue }}
        </div>
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
    </div>
    <div v-else>
        Loading
    </div>
</template>

<script setup lang="ts">
import type { GivingClue } from '~~/types/redis';
import { useStore } from '~/store';
import type { ShallowRef } from 'vue';
import { useGameSocket } from '~/composables/sockets/game';
import { animate } from 'animejs';

const route = useRoute();
const store = useStore();
const hearts = ref<{ id: number }[]>([]);
const heartRefs = ref<HTMLElement[]>([]);
const lobbyId = route.params.id as string;

const { gameSocket: gameSocket, game, connected, lobby, voted } = useGameSocket(lobbyId, { onHeart: animateHeart });

const clue = ref('');
const animateClue = ref(false);
const clueGiven: ShallowRef<GivingClue | undefined> = ref();

const myTurn: ComputedRef<boolean> = computed(() => {
    if (!store.me?.userid || !game.value?.turn) {
        return false;
    }

    return store.me.userid == game.value.turn;
});

const turnName: ComputedRef<string> = computed(() => {
    if (!game.value?.turn || !lobby.value?.players) {
        return '';
    }

    return lobby.value.players.find(x => x.id == game.value?.turn)?.username ?? '';
});

function sendClue() {
    gameSocket.emit('giveClue', clue.value);
    clue.value = '';
}

function vote(rating: number) {
    // 1=- 2=+ 3=VOTE! 4=heart
    gameSocket.emit('vote', rating);
}

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

function getClue(sentClue: GivingClue) {
    if (!animateClue.value) {
        clueGiven.value = sentClue;
        animateClue.value = true;

        setTimeout(() => {
            animateClue.value = false;
            gameSocket.emit('game');
        }, 5000);
    }
    else {
        clueGiven.value = sentClue;
    }
}

onMounted(() => {
    gameSocket.emit('game');
    gameSocket.on('givingClue', value => {
        getClue(value);
    });
});

onUnmounted(() => {
    gameSocket.off('givingClue');
});
</script>

<style lang="scss">
.heart {
    pointer-events: none;

    position: fixed;
    z-index: 1000;
    bottom: 1vh;
    left: 95vw;

    font-size: 2rem;
    color: #ff6b9d;

    opacity: 1;
}
</style>
