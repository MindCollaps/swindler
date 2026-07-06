<template>
    <div v-if="gameResults">
        <div
            v-if="imposterWon"
            class="verdict"
            :class="iWin ? 'win' : 'lose'"
        >{{ iWin ? 'You win!' : 'Imposter won' }}</div>
        <div
            v-else
            class="verdict"
            :class="iWin ? 'win' : 'lose'"
        >Crewmates Win</div>
        <div
            v-if="game?.winReason === WinReason.Guessed"
            class="reason"
        >
            {{ gameResults.wasCorrect ? 'Imposter guessed the word correctly!' : 'Imposter guessed the word incorrectly' }}
        </div>
        <div
            v-else-if="game?.winReason === WinReason.Voted"
            class="reason"
        >
            {{ gameResults.wasCorrect ? 'You correctly voted the imposter!' : 'You failed to vote the imposter' }}
        </div>
        <div class="info">
            <div>Imposter was: {{ gameResults.imposterPlayer?.username }}</div>
            <div v-if="game?.winReason === WinReason.Guessed">Imposter guessed: {{ game?.imposterGuess }}</div>
            <div>The word was: {{ game?.word?.word }}</div>
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
        {{ lobby?.gameNumber === lobby?.gameRules.games ? 'End game' : 'Next Game' }}
    </common-button>
    <common-button
        v-if="store.me?.userid === lobby?.founder.id"
        class="return-to-lobby"
        type="secondary"
        @click="$emit('returnToLobby')"
    >
        Return to lobby
    </common-button>
    <word-log/>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import { useStore } from '~/store';
import { WinReason } from '~~/types/redis';
import type { LobbyGame, Lobby } from '~~/types/redis';

const props = defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    gameResults: any;
}>();

defineEmits<{
    (e: 'nextGame' | 'returnToLobby'): void;
}>();

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
    display: flex;
    flex-direction: column;
    gap: 8px;

    margin-top: 16px;
    padding: 16px;
    border-radius: 8px;

    font-size: 14px;

    background: $darkgray900;

    animation: fade-up 0.35s $easeOutQuint 0.32s both;
}

.voted-out {
    margin-top: 16px;
    margin-bottom: 16px;
    font-size: 14px;
    animation: fade-up 0.35s $easeOutQuint 0.44s both;
}

.votes {
    margin-bottom: 16px;
    font-size: 14px;
    animation: fade-up 0.35s $easeOutQuint 0.52s both;

    div {
        padding-left: 16px;
    }
}

.reason {
    animation: fade-up 0.35s $easeOutQuint 0.2s both;
}

.next-game {
    margin-top: 16px;
    animation: fade-up 0.35s $easeOutQuint 0.6s both;
}

.return-to-lobby {
    margin-top: 16px;
    animation: fade-up 0.35s $easeOutQuint 0.6s both;
}

.win {
    font-size: 38px;
    font-weight: bold;
    color: $success500;
    text-align: center;

    @include mobile {
        font-size: 32px;
    }
}

.lose {
    font-size: 38px;
    font-weight: bold;
    color: $error500;
    text-align: center;

    @include mobile {
        font-size: 32px;
    }
}

.verdict {
    animation: verdict-stamp 0.45s $easeOutExpo both;
}

@keyframes verdict-stamp {
    from {
        transform: scale(1.35);
        opacity: 0;
        filter: blur(6px);
    }

    to {
        transform: scale(1);
        opacity: 1;
        filter: blur(0);
    }
}

@keyframes fade-up {
    from {
        transform: translateY(8px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>
