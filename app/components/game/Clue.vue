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
import { ToastMode } from '~~/types/toast';

const clue = ref('');

const route = useRoute();
const lobbyId = route.params.id as string;

const { gameSocket } = useGameSocket(lobbyId);
const { showToast } = useToastManager();

function sendClue() {
    if (clue.value.length < 1) {
        showToast({
            mode: ToastMode.Error,
            message: 'You have to give a clue!',
        });
        return;
    }

    gameSocket.emit('giveClue', clue.value);
    clue.value = '';
}
</script>

