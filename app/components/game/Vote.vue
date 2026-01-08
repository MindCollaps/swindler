<template>
    <div class="vote-wrap">
        <div class="vote-buttons">
            <div class="vote-button">
                <common-button :disabled="myTurn" icon="material-symbols:thumb-up-sharp"
                    :type="!voted?.up.voted ? 'transparent' : 'primary'" icon-width="32px" @click="addVote(2, true)" />
                <div class="vote-button-description">{{ voted?.up.voters.length ?? 0 > 0 ? getVotersNames(voted?.up.voters) : 'Empty' }}</div>
            </div>
             <div class="vote-button">
                <common-button :disabled="myTurn" icon="material-symbols:thumb-down-sharp"
                    :type="!voted?.down.voted ? 'transparent' : 'primary'" icon-width="32px" @click="addVote(1, true)" />
                <div class="vote-button-description">{{ voted?.down.voters.length ?? 0 > 0 ? getVotersNames(voted?.down.voters) : 'Empty' }}</div>
            </div>
        </div>
         <div class="imposter-button">
            <common-button @click="addVote(3, true)" :type="!voted?.imposter.voted ? 'transparent' : 'primary'"
                icon="material-symbols:comedy-mask-rounded" icon-width="32px" />
            <div class="vote-button-description">{{ voted?.imposter.voters.length ?? 0 > 0 ? getVotersNames(voted?.imposter.voters) : 'Empty' }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useGameSocket } from '~/composables/sockets/game';
import { useStore } from '~/store';

const route = useRoute();
const lobbyId = route.params.id as string;
const store = useStore();

const { voted, addVote, myTurn, lobby } = useGameSocket(lobbyId);

function getVotersNames(voterIds: number[] | undefined): string {
    if (!voterIds || voterIds.length === 0 || !lobby.value) return '';

    return voterIds.map(id => {
        if (store.me?.userid === id) return 'You';
        const player = lobby.value?.players.find(p => p.id === id);
        return player ? player.username : 'Unknown';
    }).join(', ');
}
</script>

<style scoped lang="scss">
.vote-wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.imposter-button {
    margin-top: 16px;
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
}

.vote-buttons {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 64px;
}

.vote-button {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.vote-button-description {
    padding: 16px;
    border-radius: 16px;
    background: $darkgray900;
    text-align: center;
}
</style>
