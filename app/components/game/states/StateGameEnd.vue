<template>
    <div class="title">Game ended</div>
    <div v-if="gameResults">
        <div v-if="game?.winReason === WinReason.Guessed">
            {{ gameResults.wasCorrect ? 'Imposter guessed the word correctly!' : 'Imposter guessed the word incorrectly' }}
        </div>
        <div v-else-if="game?.winReason === WinReason.Voted">
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
        </template>
    </div>
    <common-button
        v-if="store.me?.userid === lobby?.founder.id"
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

defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    gameResults: any;
}>();

defineEmits<{
    (e: 'nextGame'): void;
}>();

const store = useStore();
</script>

<style scoped lang="scss">
.title {
    margin-bottom: 24px;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
}
</style>
