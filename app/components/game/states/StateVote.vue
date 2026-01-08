<template>
    <div class="state-vote">
        <div class="title">Vote</div>
        <div
            v-for="player in sortedPlayers"
            :key="player.id"
            class="player-vote"
        >
            <span class="player-name">{{ player.username }}</span>
            <div class="actions">
                <span class="voters">{{ getVotersNames(player.id) }}</span>
                <common-button
                    @click="$emit('voteForPlayer', player.id)"
                >Vote</common-button>
            </div>
        </div>
        <word-log/>
    </div>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import type { LobbyGame, Lobby } from '~~/types/redis';
import { GameEventType } from '~~/types/redis';
import type { GameStateEmits } from '~~/types/game-state';
import { useStore } from '~/store';

const props = defineProps<{
    game: LobbyGame | null;
    lobby: Lobby | null;
    hasVotedForPlayer: boolean;
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

function getVotersNames(playerId: number): string {
    if (!props.lobby || !props.lobby.gameEvents) return '';
    
    const votes = props.lobby.gameEvents.filter(x => 
        x.type === GameEventType.VotedForPlayer && 
        x.gameNumber === props.lobby?.gameNumber &&
        x.receiverId === playerId
    );

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

.player-vote {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 8px;
    border-radius: 8px;

    background: rgb(255, 255, 255, 0.05);

    .actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .voters {
            font-size: 0.8rem;
            color: $lightgray100;
        }
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
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
}
</style>
