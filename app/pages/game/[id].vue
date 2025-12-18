<template>
    <div v-if="connected">
        <template v-if="game?.gameState === GameState.Round">
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
            <player-list :lobby="lobby" />
            <br>
            <br>
            <clue v-if="myTurn" :lobby-id="lobbyId" />
            <div v-if="game?.imposter">
                <common-button @click="showGuessInput = !showGuessInput">Guess Word</common-button>
                <div v-if="showGuessInput">
                    <common-input-text v-model="guessInputValue" placeholder="Guess the word" />
                    <common-button @click="submitGuess">Submit</common-button>
                </div>
            </div>
        </template>
        <template v-if="game?.gameState === GameState.Idle">
            Waiting for game to start...
        </template>
        <template v-if="game?.gameState === GameState.Cue">
            <template v-if="store.me?.developer">
                {{ JSON.stringify(game) }}
                <br><br>
                {{ JSON.stringify(lobby) }}
                <br><br>
                {{ JSON.stringify(voted) }}
                <br><br>
            </template>
            {{ clue?.player.username }} said {{ clue?.clue }}
            <vote :lobby-id="lobbyId" />
            <div class="timer">
                Time until continue: {{ timeRemaining }}s
            </div>
            <common-button :disabled="isReady" @click="skipWait">
                {{ isReady ? 'Waiting for others...' : 'Ready' }} ({{ game?.readyToContinue?.length ?? 0 }}/{{ lobby?.players.length ?? 0 }})
            </common-button>
        </template>
        <template v-if="game?.gameState === GameState.RoundEnd">
            Round ended.
        </template>
        <template v-if="game?.gameState === GameState.Vote">
            Lets vote someone out
            <div v-for="player in lobby?.players" :key="player.id">
                {{ player.username }}
                <common-button :disabled="hasVotedForPlayer" @click="voteForPlayer(player.id)">Vote</common-button>
            </div>
            <div v-if="game?.imposter">
                <common-button @click="showGuessInput = !showGuessInput">Guess Word</common-button>
                <div v-if="showGuessInput">
                    <common-input-text v-model="guessInputValue" placeholder="Guess the word" />
                    <common-button @click="submitGuess">Submit</common-button>
                </div>
            </div>
        </template>
        <template v-if="game?.gameState === GameState.ImposterVote">
            The Imposter thinks '{{ game?.imposterGuess?.toLowerCase() }}' is the word.
            <br>
            The word was: {{ game?.word?.word?.toLowerCase() }}
        </template>
        <template v-if="game?.gameState === GameState.GameEnd">
            Game ended!
            <div v-if="gameResults">
                <div v-if="game.winReason === WinReason.Guessed">
                    {{ gameResults.wasCorrect ? 'Imposter guessed the word correctly!' : 'Imposter guessed the word incorrectly' }}
                </div>
                <div v-else-if="game.winReason === WinReason.Voted">
                    {{ gameResults.wasCorrect ? 'You correctly voted the imposter!' : 'You failed to vote the imposter' }}
                </div>
                <br>
                Imposter was: {{ gameResults.imposterPlayer?.username }}
                <br>
                The word was: {{ game?.word?.word }}
                <br>
                <template v-if="game?.winReason === WinReason.Voted">
                    Voted out: {{ gameResults.votedPlayer?.username ?? 'No one' }}
                    <br>
                </template>
                <br>
                <template v-if="game?.winReason === WinReason.Voted">
                    Votes:
                <div v-for="vote in gameResults.votes" :key="vote.initiatorId">
                    <template v-if="vote.initiatorId !== -1">
                        {{ lobby?.players.find(p => p.id === vote.initiatorId)?.username }} voted for
                    </template>
                    <template v-else>
                        Someone voted for
                    </template>
                    {{ lobby?.players.find(p => p.id === vote.receiverId)?.username }}
                </div>
                </template>
            </div>
            <common-button v-if="store.me?.userid === lobby?.founder.id" @click="nextGame">
                Next Game
            </common-button>
        </template>
        <template v-if="game?.gameState === GameState.LobbyEnd">
            Lobby ended!
            Thanks for playing!
        </template>
        <heart :lobby-id="lobbyId" />
    </div>
    <div v-else>
        Loading
    </div>
</template>

<script setup lang="ts">
import Heart from '~/components/game/Heart.vue';
import PlayerList from '~/components/game/PlayerList.vue';
import Vote from '~/components/game/Vote.vue';
import Clue from '~/components/game/Clue.vue';
import { useStore } from '~/store';
import { GameState, WinReason } from '~~/types/redis';
import { useGameSocket } from '~/composables/sockets/game';

const route = useRoute();

const lobbyId = route.params.id as string;
const store = useStore();

const { gameSocket: gameSocket, game, connected, lobby, myTurn, clue, voteForPlayer, gameResults, nextGame, hasVotedForPlayer, guessWord, voted } = useGameSocket(lobbyId);

const timeRemaining = ref(0);
const isReady = ref(false);
const showGuessInput = ref(false);
const guessInputValue = ref('');
let timerInterval: ReturnType<typeof setInterval> | null = null;

function submitGuess() {
    if (guessInputValue.value) {
        guessWord(guessInputValue.value);
        showGuessInput.value = false;
    }
}

watch(() => game.value?.cueEndTime, (newVal) => {
    if (timerInterval) clearInterval(timerInterval);
    if (newVal) {
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        isReady.value = false;
    } else {
        timeRemaining.value = 0;
    }
}, { immediate: true });

function updateTimer() {
    if (!game.value?.cueEndTime) {
        timeRemaining.value = 0;
        return;
    }
    const diff = Math.ceil((game.value.cueEndTime - Date.now()) / 1000);
    timeRemaining.value = diff > 0 ? diff - 2 : 0;
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
</style>
