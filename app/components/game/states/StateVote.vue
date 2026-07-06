<template>
    <div class="state-vote">
        <div class="title">Vote</div>
        <role-card
            class="vote-role-card"
            :game="game"
        />
        <div
            v-for="(player, index) in sortedPlayers"
            :key="player.id"
            class="player-vote"
            :style="{ '--i': index }"
        >
            <span class="player-name">{{ player.username }}</span>
            <div class="actions">
                <span
                    :key="getVotersNames(player.id)"
                    class="voters"
                >{{ getVotersNames(player.id) }}</span>
                <common-button
                    :disabled="spectator"
                    :primary-color="iVoted(player.id) ? 'darkgray600': 'primary500'"
                    @click="$emit('voteForPlayer', player.id)"
                >Vote</common-button>
            </div>
        </div>
        <word-log/>
    </div>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import RoleCard from '~/components/game/RoleCard.vue';
import type { LobbyGame, Lobby } from '~~/types/redis';
import { GameEventType } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';
import { useStore } from '~/store';

const props = defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    hasVotedForPlayer: boolean;
    spectator: boolean;
}>();

defineEmits<GameStateEmits>();
const store = useStore();

const sortedPlayers = computed(() => {
    if (!props.lobby || !props.lobby.players) return [];

    const players = [...props.lobby.players];

    // During game, sort by turn order if available
    if (props.game?.turnOrder && props.game.turnOrder.length > 0) {
        return props.game.turnOrder
            .map(id => players.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => !!p);
    }

    return players;
});

function iVoted(playerId: number): boolean {
    if (!props.lobby || !props.lobby.gameEvents) return false;

    return props.lobby.gameEvents.some(x => x.type === GameEventType.VotedForPlayer &&
        x.gameNumber === props.lobby?.gameNumber &&
        x.initiatorId === store.me?.userid &&
        x.receiverId === playerId);
}

function getVotersNames(playerId: number): string {
    if (!props.lobby || !props.lobby.gameEvents) return '';

    const votes = props.lobby.gameEvents.filter(x => x.type === GameEventType.VotedForPlayer &&
        x.gameNumber === props.lobby?.gameNumber &&
        x.receiverId === playerId);

    if (votes.length === 0) return '';

    return votes.map(v => {
        if (v.initiatorId === store.me?.userid) return 'You';
        const player = props.lobby?.players.find(p => p.id === v.initiatorId);
        return player ? player.username : 'Unknown';
    }).join(', ');
}
</script>

<style scoped lang="scss">
.state-vote {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.vote-role-card {
    align-self: center;
    width: min(320px, 100%);
}

.player-vote {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 8px;
    border-radius: 8px;

    background: $darkgray900;

    animation: vote-row-in 0.3s $easeOutQuint both;
    animation-delay: calc(var(--i, 0) * 50ms);

    .player-name {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .actions {
        display: flex;
        flex-shrink: 0;
        gap: 8px;
        align-items: center;

        .voters {
            font-size: 13px;
            color: $lightgray100;
            animation: voters-flash 0.6s $easeOutQuart;
        }
    }
}

@keyframes vote-row-in {
    from {
        transform: translateY(8px);
        opacity: 0;
    }
}

@keyframes voters-flash {
    from {
        color: $primary300;
    }
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
    font-size: 38px;
    font-weight: bold;
    text-align: center;

    @include mobile {
        font-size: 32px;
    }
}
</style>
