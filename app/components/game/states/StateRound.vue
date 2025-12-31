<template>
    <div class="state-round">
        <div class="info">
            <div class="round">
                Round {{ game?.round }}
            </div>
            <div
                v-if="!game?.imposter"
                class="word"
            >
                Word: {{ game?.word?.word }}
            </div>
            <div
                v-if="myTurn"
                class="myturn"
            >
                Your Turn
            </div>
            <div
                v-else
                class="othersturn"
            >
                {{ turnName }}'s turn
            </div>
            <div
                v-if="game?.imposter"
                class="imposter"
            >
                You are the imposter!
            </div>
            <div
                v-else
                class="notimposter"
            >You are not the imposter</div>
        </div>
        <player-list
            :lobby="lobby"
            show-turn
        />
        <clue
            v-if="myTurn"
            class="clue"
        />
        <div
            v-if="game?.imposter"
            class="imposter-guess"
        >
            <common-button
                class="toggle"
                @click="showGuessInput = !showGuessInput"
            >Guess Word</common-button>
            <div
                v-if="showGuessInput"
                class="input-bracket"
            >
                <common-input-text
                    v-model="guessInputValue"
                    class="input-field"
                    placeholder="Guess the word"
                />
                <common-button
                    class="submit-input"
                    @click="submitGuess"
                >Submit</common-button>
            </div>
        </div>

        <word-log/>
    </div>
</template>

<script setup lang="ts">
import PlayerList from '~/components/game/PlayerList.vue';
import Clue from '~/components/game/Clue.vue';
import WordLog from '~/components/game/WordLog.vue';
import type { LobbyGame, Lobby } from '~~/types/redis';

defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    myTurn: boolean;
    turnName: string;
}>();

const emit = defineEmits<{
    (e: 'guessWord', word: string): void;
}>();

const showGuessInput = ref(false);
const guessInputValue = ref('');

function submitGuess() {
    if (guessInputValue.value) {
        emit('guessWord', guessInputValue.value);
        showGuessInput.value = false;
    }
}
</script>

<style scoped lang="scss">
.info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;

    .round {
        grid-column: 2;
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
    }

    .myturn {
        grid-column: 1;
        font-weight: bold;
        color: $success500;
    }

    .othersturn {
        grid-column: 1;
        font-weight: bold;
        color: $primary300;
    }

    .imposter {
        grid-column: 1;
        font-weight: bold;
        color: $error500;
    }

    .notimposter {
        grid-column: 1;
        font-weight: bold;
        color: $success300;
    }

    .word {
        grid-column: 2;
        font-size: 1.2rem;
        text-align: center;
    }
}

.clue {
    margin-top: 32px;
    margin-bottom: 32px;
}

.imposter-guess {
    margin-top: 16px;

    .toggle {
        width: 100%;
        margin-bottom: 8px;
    }

    .input-bracket {
        display: flex;
        gap: 8px;

        .input-field {
            flex: 1;
        }
    }
}
</style>
