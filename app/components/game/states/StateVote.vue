<template>
    <div class="state-vote">
        <div class="title">Vote</div>
        <div
            v-for="player in lobby?.players"
            :key="player.id"
            class="player-vote"
        >
            <span class="player-name">{{ player.username }}</span>
            <common-button
                :disabled="hasVotedForPlayer"
                @click="$emit('voteForPlayer', player.id)"
            >Vote</common-button>
        </div>
        <word-log/>
    </div>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import type { LobbyGame, Lobby } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';

defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    hasVotedForPlayer: boolean;
}>();

defineEmits<GameStateEmits>();
</script>

<style scoped lang="scss">
.state-vote {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.player-vote {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 8px;
    border-radius: 8px;

    background: rgb(255, 255, 255, 0.05);
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

        .common-input-text {
            flex: 1;
        }
    }
}

.title {
    margin-bottom: 24px;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
}
</style>
