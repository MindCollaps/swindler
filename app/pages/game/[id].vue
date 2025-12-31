<template>
    <div
        v-if="connected"
        class="game"
    >
        <component
            :is="currentStateComponent"
            v-if="currentStateComponent"
            v-bind="componentProps"
            @guessWord="guessWord"
            @nextGame="nextGame"
            @skipWait="skipWait"
            @voteForPlayer="voteForPlayer"
        />
        <heart
            v-for="heart in hearts"
            :key="heart.id"
            :x="heart.x"
            :y="heart.y"
        />
    </div>
    <div v-else>
        Loading
    </div>
</template>

<script setup lang="ts">
import Heart from '~/components/game/Heart.vue';
import { GameState } from '~~/types/redis';
import { useGameSocket } from '~/composables/sockets/game';

import StateRound from '~/components/game/states/StateRound.vue';
import StateIdle from '~/components/game/states/StateIdle.vue';
import StateCue from '~/components/game/states/StateCue.vue';
import StateRoundEnd from '~/components/game/states/StateRoundEnd.vue';
import StateVote from '~/components/game/states/StateVote.vue';
import StateImposterVote from '~/components/game/states/StateImposterVote.vue';
import StateGameEnd from '~/components/game/states/StateGameEnd.vue';
import StateLobbyEnd from '~/components/game/states/StateLobbyEnd.vue';

definePageMeta({
    layout: 'empty',
});

const route = useRoute();

const lobbyId = route.params.id as string;

const { gameSocket: gameSocket, game, connected, lobby, myTurn, clue, voteForPlayer, gameResults, nextGame, hasVotedForPlayer, guessWord, voted } = useGameSocket(lobbyId);

const timeRemaining = ref(0);
const isReady = ref(false);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const hearts = ref<{ id: number; x: number; y: number }[]>([]);
let heartId = 0;


gameSocket.on('heart', () => {
    const id = heartId++;
    hearts.value.push({ id, x: Math.random() * 90, y: Math.random() * 90 });
    setTimeout(() => {
        hearts.value = hearts.value.filter(h => h.id !== id);
    }, 2000);
});

watch(() => game.value?.cueEndTime, newVal => {
    if (timerInterval) clearInterval(timerInterval);
    if (newVal) {
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        isReady.value = false;
    }
    else {
        timeRemaining.value = 0;
    }
}, { immediate: true });

function updateTimer() {
    if (!game.value?.cueEndTime) {
        timeRemaining.value = 0;
        return;
    }
    const diff = Math.ceil((game.value.cueEndTime - Date.now()) / 1000);
    timeRemaining.value = diff > 0 ? diff - 1 : 0;
}

function skipWait() {
    gameSocket.emit('skipWait');
    isReady.value = true;
}

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
});

const turnName: ComputedRef<string> = computed(() => {
    if (!game.value?.turn || !lobby.value?.players) {
        return '';
    }

    return lobby.value.players.find(x => x.id == game.value?.turn)?.username ?? '';
});

const stateComponents = {
    [GameState.Round]: StateRound,
    [GameState.Idle]: StateIdle,
    [GameState.Cue]: StateCue,
    [GameState.RoundEnd]: StateRoundEnd,
    [GameState.Vote]: StateVote,
    [GameState.ImposterVote]: StateImposterVote,
    [GameState.GameEnd]: StateGameEnd,
    [GameState.LobbyEnd]: StateLobbyEnd,
};

const currentStateComponent = computed(() => {
    if (game.value?.gameState === undefined) return null;
    return stateComponents[game.value.gameState];
});

const componentProps = computed(() => {
    switch (game.value?.gameState) {
        case GameState.Round:
            return { game: game.value, lobby: lobby.value, myTurn: myTurn.value, turnName: turnName.value };
        case GameState.Cue:
            return { game: game.value, lobby: lobby.value, voted: voted.value, clue: clue.value, timeRemaining: timeRemaining.value, isReady: isReady.value };
        case GameState.RoundEnd:
            return { timeRemaining: timeRemaining.value };
        case GameState.Vote:
            return { game: game.value, lobby: lobby.value, hasVotedForPlayer: hasVotedForPlayer.value };
        case GameState.ImposterVote:
            return { game: game.value };
        case GameState.GameEnd:
            return { game: game.value, lobby: lobby.value, gameResults: gameResults.value };
        default:
            return {};
    }
});

onMounted(() => {
    gameSocket.emit('game');
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

.game {
    padding: 16px;
}
</style>
