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
        <transition
            mode="out-in"
            name="state-fade"
        >
            <div
                v-if="currentStateComponent"
                :key="game?.gameState"
                class="state-wrap"
            >
                <component
                    :is="currentStateComponent"
                    v-bind="componentProps"
                    @guessWord="guessWord"
                    @nextGame="nextGame"
                    @returnToLobby="returnToLobby"
                    @skipWait="skipWait"
                    @voteForPlayer="voteForPlayer"
                />
            </div>
        </transition>
        <heart v-if="!spectator"/>
        <role-deal
            v-if="showDeal"
            :game-number="lobby?.gameNumber"
            :imposter="game?.imposter ?? false"
            :word="game?.word?.word"
            :word-list-name="game?.word?.wordListName"
            @dismiss="showDeal = false"
        />
    </div>
    <div
        v-else-if="connectionError"
        class="connection-lost"
    >
        <common-box>
            <h1>Can't reach the game server</h1>
            <p v-if="game">Your connection dropped mid-game. The round is still running - get back in.</p>
            <p v-else>The game might be fine - your connection isn't. Check your internet and try again.</p>
            <common-button @click="retry">Try Again</common-button>
        </common-box>
    </div>
    <div
        v-else
        aria-live="polite"
        class="game-loading"
        role="status"
    >
        <common-loader smol/>
        <p>{{ game ? 'Reconnecting...' : 'Joining game...' }}</p>
    </div>
</template>

<script lang="ts">
import { GameState } from '~~/types/redis';
import { useGameSocket } from '~/composables/sockets/game';
import RoleDeal from '~/components/game/RoleDeal.vue';

import StateRound from '~/components/game/states/StateRound.vue';
import StateIdle from '~/components/game/states/StateIdle.vue';
import StateCue from '~/components/game/states/StateCue.vue';
import StateRoundEnd from '~/components/game/states/StateRoundEnd.vue';
import StateVote from '~/components/game/states/StateVote.vue';
import StateImposterWord from '~/components/game/states/StateImposterWord.vue';
import StateGameEnd from '~/components/game/states/StateGameEnd.vue';
import StateLobbyEnd from '~/components/game/states/StateLobbyEnd.vue';
import Heart from '~/components/game/Heart.vue';
</script>

<script setup lang="ts">
definePageMeta({
    layout: 'empty',
});

const route = useRoute();

const lobbyId = route.params.id as string;

const { gameSocket, game, connected, lobby, myTurn, clue, voteForPlayer, gameResults, nextGame, hasVotedForPlayer, guessWord, voted, lobbyNotFound, connectionError, retry, spectator } = useGameSocket(lobbyId);

const showDeal = ref(false);
const seenDealSignatures = new Set<string>();

const dealKey = computed(() => {
    if (spectator.value) return '';
    if (game.value?.gameState !== GameState.Round) return '';
    if (game.value.round !== 1) return '';
    if (game.value.turnOrder[0] !== game.value.turn) return '';

    const role = game.value?.imposter ? 'swindler' : (game.value?.word?.word ?? '');
    if (!role) return '';

    const gameSignature = game.value?.stateTimestamp ?? game.value?.stateVersion;
    if (gameSignature === undefined) return '';

    return `${ lobbyId }:${ gameSignature }:${ role }`;
});

watch(dealKey, async key => {
    if (!key || seenDealSignatures.has(key)) return;

    seenDealSignatures.add(key);

    // Force a remount when transitioning game-to-game inside one route session.
    showDeal.value = false;
    await nextTick();
    showDeal.value = true;
}, { immediate: true });

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
            return { timeRemaining: timeRemaining.value };
        case GameState.Vote:
            return { game: game.value, lobby: lobby.value, hasVotedForPlayer: hasVotedForPlayer.value, spectator: spectator.value };
        case GameState.ImposterWord:
            return { game: game.value, spectator: spectator.value };
        case GameState.GameEnd:
            return { game: game.value, lobby: lobby.value, gameResults: gameResults.value };
        case GameState.LobbyEnd:
            return { lobby: lobby.value };
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
    max-width: 640px;
    margin: 0 auto;
    padding: 32px;
}

.state-fade-enter-active {
    transition: opacity 0.2s $easeOutQuint, transform 0.2s $easeOutQuint;
}

.state-fade-leave-active {
    transition: opacity 0.15s $easeOutQuint;
}

.state-fade-enter-from {
    transform: translateY(8px);
    opacity: 0;
}

.state-fade-leave-to {
    opacity: 0;
}

.spectator {
    position: fixed;
    z-index: $z-overlay;
    top: 16px;
    right: 16px;

    padding: 8px 16px;
    border-radius: 8px;

    font-size: 1.5em;
    color: $lightgray0;

    background-color: $darkgray900;
}

.game-loading {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;

    padding: 64px 16px;

    color: $lightgray150;
}

.connection-lost {
    h1 {
        font-size: 24px;
    }

    p {
        font-size: 14px;
        color: $lightgray150;
    }
}
</style>
