<template>
    <common-lobby-not-found v-if="lobbyNotFound"/>
    <div
        v-else-if="connected"
        class="game"
    >
        <div
            v-if="spectator"
            class="spectator"
        >Spectator</div>
        <component
            :is="currentStateComponent"
            v-if="currentStateComponent"
            v-bind="componentProps"
            @guessWord="guessWord"
            @nextGame="nextGame"
            @returnToLobby="returnToLobby"
            @skipWait="skipWait"
            @voteForPlayer="voteForPlayer"
        />
        <heart v-if="!spectator"/>
    </div>
    <div v-else>
        Loading...
    </div>
</template>

<script setup lang="ts">
import { GameState } from '~~/types/redis';
import { useGameSocket } from '~/composables/sockets/game';

import StateRound from '~/components/game/states/StateRound.vue';
import StateIdle from '~/components/game/states/StateIdle.vue';
import StateCue from '~/components/game/states/StateCue.vue';
import StateRoundEnd from '~/components/game/states/StateRoundEnd.vue';
import StateVote from '~/components/game/states/StateVote.vue';
import StateImposterWord from '~/components/game/states/StateImposterWord.vue';
import StateGameEnd from '~/components/game/states/StateGameEnd.vue';
import StateLobbyEnd from '~/components/game/states/StateLobbyEnd.vue';
import Heart from '~/components/game/Heart.vue';

definePageMeta({
    layout: 'empty',
});

const route = useRoute();

const lobbyId = route.params.id as string;

const { gameSocket: gameSocket, game, connected, lobby, myTurn, clue, voteForPlayer, gameResults, nextGame, hasVotedForPlayer, guessWord, voted, lobbyNotFound, spectator } = useGameSocket(lobbyId);

const timeRemaining = ref(0);
const isReady = ref(false);
let timerInterval: ReturnType<typeof setInterval> | null = null;

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
        if (timerInterval) clearInterval(timerInterval);
        return;
    }

    const diff = Math.max(0, Math.ceil((game.value.cueEndTime - Date.now()) / 1000));
    timeRemaining.value = diff;

    if (diff === 0 && timerInterval) {
        clearInterval(timerInterval);
    }
}

function skipWait() {
    gameSocket.emit('skipWait');
    isReady.value = true;
}

function returnToLobby() {
    gameSocket.emit('returnToLobby');
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
    [GameState.ImposterWord]: StateImposterWord,
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
            return { game: game.value, lobby: lobby.value, myTurn: myTurn.value, turnName: turnName.value, spectator: spectator.value };
        case GameState.Cue:
            return { game: game.value, lobby: lobby.value, voted: voted.value, clue: clue.value, timeRemaining: timeRemaining.value, isReady: isReady.value, spectator: spectator.value };
        case GameState.RoundEnd:
            return { timeRemaining: timeRemaining.value, spectator: spectator.value };
        case GameState.Vote:
            return { game: game.value, lobby: lobby.value, hasVotedForPlayer: hasVotedForPlayer.value, spectator: spectator.value };
        case GameState.ImposterWord:
            return { game: game.value, spectator: spectator.value };
        case GameState.GameEnd:
            return { game: game.value, lobby: lobby.value, gameResults: gameResults.value, spectator: spectator.value };
        case GameState.LobbyEnd:
            return { lobby: lobby.value, spectator: spectator.value };
        default:
            return {};
    }
});

onMounted(() => {
    gameSocket.emit('game');
});
</script>

<style lang="scss">
.game {
    width: 100%;
    padding: 32px;
}

.spectator {
    position: fixed;
    z-index: 1000;
    top: 16px;
    right: 16px;

    padding: 8px 16px;
    border-radius: 8px;

    font-size: 1.5em;
    color: $lightgray0;

    background-color: $darkgray900;
}
</style>
