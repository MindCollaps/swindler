<template>
    <div>
        <common-input-text
            v-model="clue"
            @keyup.enter="sendClue"
        >Clue</common-input-text>
        <common-button @click="sendClue">Send</common-button>
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

const clue = ref('');

const { gameSocket } = useGameSocket(props.lobbyId);

function sendClue() {
    gameSocket.emit('giveClue', clue.value);
    clue.value = '';
}
</script>

