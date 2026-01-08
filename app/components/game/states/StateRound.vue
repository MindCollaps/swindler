<template>
    <div class="state-round">
        <game-info
            :game="game"
            :lobby="lobby"
            :my-turn="myTurn"
            :turn-name="turnName"
        />
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
import GameInfo from '../GameInfo.vue';
import type { LobbyGame, Lobby } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';

defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    myTurn: boolean;
    turnName: string;
}>();

const emit = defineEmits<GameStateEmits>();

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
