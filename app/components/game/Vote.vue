<template>
    <div class="vote-buttons">
        <common-button
            :disabled="myTurn || voted?.down.voted"
            @click="addVote(1, true)"
        >😖 {{ voted?.down.num
            === 0 || !voted?.down ? undefined :
                voted.down.num }}</common-button>
        <common-button
            :disabled="myTurn || voted?.up.voted"
            @click="addVote(2, true)"
        >🥰 {{ voted?.up.num === 0
            || !voted?.up ? undefined : voted.up.num
        }}
        </common-button>
        <common-button
            :disabled="voted?.imposter.voted"
            @click="addVote(3, true)"
        >🕵️ {{
            voted?.imposter.num === 0 || !voted?.imposter ?
                undefined : voted.imposter.num }}
        </common-button>
        <common-button @click="addVote(4, true)">❤️</common-button>
    </div>
</template>

<script lang="ts" setup>
import { useGameSocket } from '~/composables/sockets/game';

const route = useRoute();
const lobbyId = route.params.id as string;

const { voted, addVote, myTurn } = useGameSocket(lobbyId);
</script>

<style scoped lang="scss">
.vote-buttons {
    display: flex;
    gap: 8px;
}
</style>
