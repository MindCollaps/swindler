<template>
    <div>
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
            :disabled="myTurn || voted?.imposter.voted"
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

const props = defineProps({
    lobbyId: {
        type: String,
        required: true,
    },
});

const { voted, addVote, myTurn } = useGameSocket(props.lobbyId);
</script>

