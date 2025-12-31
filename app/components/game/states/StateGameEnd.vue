<template>
    <div v-if="gameResults">
        <div
            v-if="imposterWon"
            :class="iWin ? 'win' : 'lose'"
        >{{ iWin ? 'You win!' : 'Imposter won' }}</div>
        <div
            v-else
            :class="iWin ? 'win' : 'lose'"
        >Crewmates Win</div>
        <div v-if="game?.winReason === WinReason.Guessed">
            {{ gameResults.wasCorrect ? 'Imposter guessed the word correctly!' : 'Imposter guessed the word incorrectly' }}
        </div>
        <div v-else-if="game?.winReason === WinReason.Voted">
            {{ gameResults.wasCorrect ? 'You correctly voted the imposter!' : 'You failed to vote the imposter' }}
        </div>
        <div class="info">
            <div class="imposter-was">Imposter was: {{ gameResults.imposterPlayer?.username }}</div>
            <div class="word">The word was: {{ game?.word?.word }}</div>
        </div>
        <div
            v-if="game?.winReason === WinReason.Voted"
            class="voted-out"
        >
            Voted out: {{ gameResults.votedPlayer?.username ?? 'No one' }}
        </div>
        <div
            v-if="game?.winReason === WinReason.Voted"
            class="votes"
        >
            Votes:
            <div
                v-for="vote in gameResults.votes"
                :key="vote.initiatorId"
            >
                <template v-if="vote.initiatorId !== -1">
                    {{ lobby?.players.find(p => p.id === vote.initiatorId)?.username }} voted for
                </template>
                <template v-else>
                    Someone voted for
                </template>
                {{ lobby?.players.find(p => p.id === vote.receiverId)?.username }}
            </div>
        </div>
    </div>
    <common-button
        v-if="store.me?.userid === lobby?.founder.id"
        class="next-game"
        @click="$emit('nextGame')"
    >
        Next Game
    </common-button>

    <word-log/>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import { useStore } from '~/store';
import { WinReason } from '~~/types/redis';
import type { LobbyGame, Lobby } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';

const props = defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    gameResults: any;
}>();

defineEmits<GameStateEmits>();

const store = useStore();

const imposterWon = computed(() => {
    return (props.game?.winReason === WinReason.Guessed && props.gameResults?.wasCorrect) || (props.game?.winReason === WinReason.Voted && !props.gameResults?.wasCorrect);
});

const iWin = computed(() => {
    if (props.game?.imposter) {
        return imposterWon.value;
    }
    else {
        return !imposterWon.value;
    }
});
</script>

<style scoped lang="scss">
.info {
    margin-top: 16px;
    padding: 16px;
    border-radius: 8px;

    font-size: 1.2em;

    background: $darkgray900;

    .imposter-was,
    .word {
        margin-top: 8px;
    }
}

.voted-out {
    margin-top: 16px;
    margin-bottom: 16px;
    font-size: 1.2em;
}

.votes {
    margin-bottom: 16px;
    font-size: 1.2em;

    div {
        padding-left: 16px;
    }
}

.next-game {
    margin-top: 16px;
}

.win {
    font-size: 2rem;
    font-weight: bold;
    color: $success500;
    text-align: center;
}

.lose {
    font-size: 2rem;
    font-weight: bold;
    color: $error500;
    text-align: center;
}
</style>
