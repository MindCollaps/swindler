<template>
    <div class="state-round">
        <dev-only>
            {{ JSON.stringify(game) }}
            <br><br>
            {{ JSON.stringify(lobby) }}
            <br><br>
        </dev-only>
        <game-info
            :game="game"
            :lobby="lobby"
            :my-turn="myTurn"
            :spectator="spectator"
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
            v-if="!spectator"
            class="imposter-guess"
        >
            <common-button
                class="toggle"
                @click="onGuessToggle"
            >Guess Word</common-button>
            <div
                v-if="showGuessInput"
                class="input-bracket"
            >
                <common-input-text
                    v-model="guessInputValue"
                    class="input-field"
                    placeholder="Guess the word"
                    @keyup.enter="submitGuess"
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
import { ToastMode } from '~~/types/toast';

const props = defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    myTurn: boolean;
    turnName: string;
    spectator: boolean;
}>();

const emit = defineEmits<GameStateEmits>();
const { showToast } = useToastManager();

const showGuessInput = ref(false);
const guessInputValue = ref('');

// Everyone sees the same Guess Word button so screens stay identical at
// rest. For the crew it's a decoy.
function onGuessToggle() {
    if (!props.game?.imposter) {
        showToast({
            mode: ToastMode.Info,
            message: 'You know the word. Nice try.',
            duration: 4000,
        });
        return;
    }
    showGuessInput.value = !showGuessInput.value;
}

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
    margin-top: 24px;

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
