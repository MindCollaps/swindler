<template>
    <div class="vote-buttons">
        <common-button
            :disabled="myTurn"
            :type="voted?.down.voted ? 'transparent' : 'primary'"
            @click="addVote(1, true)"
        >😖 {{ getVotersNames(voted?.down.voters) }}</common-button>
        <common-button
            :disabled="myTurn"
            :type="voted?.up.voted ? 'transparent' : 'primary'"
            @click="addVote(2, true)"
        >🥰 {{ getVotersNames(voted?.up.voters) }}
        </common-button>
        <common-button
            @click="addVote(3, true)"
            :type="voted?.imposter.voted ? 'transparent' : 'primary'"
        >🕵️ {{ getVotersNames(voted?.imposter.voters) }}
        </common-button>
        <common-button @click="addVote(4, true)">❤️</common-button>
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
.vote-buttons {
    display: flex;
    gap: 8px;
}
</style>
