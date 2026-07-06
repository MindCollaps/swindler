<template>
    <div class="vote-wrap">
        <div class="vote-buttons">
            <div class="vote-button">
                <common-button
                    aria-label="Trust this clue"
                    :aria-pressed="voted?.up.voted ?? false"
                    :disabled="myTurn || spectator"
                    icon="material-symbols:thumb-up-sharp"
                    icon-width="32px"
                    :type="!voted?.up.voted ? 'transparent' : 'primary'"
                    @click="triggerVote(2, !voted?.up.voted)"
                />
                <div class="vote-button-label">Trust</div>
                <div
                    :key="getVotersNames(voted?.up.voters)"
                    class="vote-button-description"
                >{{ voted?.up.voters.length ?? 0 > 0 ? getVotersNames(voted?.up.voters) : 'No votes yet' }}</div>
            </div>
            <div class="vote-button">
                <common-button
                    aria-label="Doubt this clue"
                    :aria-pressed="voted?.down.voted ?? false"
                    :disabled="myTurn || spectator"
                    icon="material-symbols:thumb-down-sharp"
                    icon-width="32px"
                    :type="!voted?.down.voted ? 'transparent' : 'primary'"
                    @click="triggerVote(1, !voted?.down.voted)"
                />
                <div class="vote-button-label">Doubt</div>
                <div
                    :key="getVotersNames(voted?.down.voters)"
                    class="vote-button-description"
                >{{ voted?.down.voters.length ?? 0 > 0 ? getVotersNames(voted?.down.voters) : 'No votes yet' }}</div>
            </div>
        </div>
        <div class="imposter-button">
            <common-button
                aria-label="Call them the Swindler"
                :aria-pressed="voted?.imposter.voted ?? false"
                :disabled="spectator"
                icon="material-symbols:comedy-mask-rounded"
                icon-width="32px"
                :type="!voted?.imposter.voted ? 'transparent' : 'primary'"
                @click="triggerVote(3, !voted?.imposter.voted)"
            />
            <div class="vote-button-label">Swindler?</div>
            <div
                :key="getVotersNames(voted?.imposter.voters)"
                class="vote-button-description"
            >{{ voted?.imposter.voters.length ?? 0 > 0 ? getVotersNames(voted?.imposter.voters) : 'No votes yet' }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useGameSocket } from '~/composables/sockets/game';
import { useStore } from '~/store';

defineProps<{
    spectator: boolean;
}>();
const route = useRoute();
const lobbyId = route.params.id as string;
const store = useStore();

const { voted, addVote, removeVote, myTurn, lobby } = useGameSocket(lobbyId);

function getVotersNames(voterIds: number[] | undefined): string {
    if (!voterIds || voterIds.length === 0 || !lobby.value) return '';

    return voterIds.map(id => {
        if (store.me?.userid === id) return 'You';
        const player = lobby.value?.players.find(p => p.id === id);
        return player ? player.username : 'Unknown';
    }).join(', ');
}

function triggerVote(id: number, add: boolean | undefined) {
    if (add) {
        addVote(id, true);
    }
    else {
        removeVote(id, true);
    }
}
</script>

<style scoped lang="scss">
.vote-wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.imposter-button {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;

    width: 100%;
    margin-top: 16px;
}

.vote-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    justify-content: center;

    width: 100%;
}

.vote-button {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
}

.vote-button-label {
    font-size: 13px;
    font-weight: 600;
    color: $lightgray150;
}

.vote-button-description {
    margin-top: 8px;
    padding: 8px 16px;
    border-radius: 8px;

    font-size: 13px;
    text-align: center;

    background: $darkgray900;

    animation: voters-flash 0.6s $easeOutQuart;
}

@keyframes voters-flash {
    from {
        color: $primary300;
    }
}
</style>
