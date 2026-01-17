<template>
    <div>
        <common-input-text
            v-model="clue"
            input-length-check
            @keyup.enter="sendClue"
        >Clue</common-input-text>
        <common-button @click="sendClue">Send</common-button>
    </div>
</template>

<script lang="ts" setup>
import { useGameSocket } from '~/composables/sockets/game';
import { ToastMode } from '~~/types/toast';
import { WordSettings } from '~~/types/word';

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

    const words = clue.value.split(' ');
    if (words.length > 1) {
        showToast({
            mode: ToastMode.Error,
            message: 'You can only give one word as clue!',
        });

        return;
    }

    if (clue.value.length > WordSettings.MAXLENGTH) {
        showToast({
            mode: ToastMode.Error,
            message: `Your clue exceeds the maximum word length of ${ WordSettings.MAXLENGTH } characters!`,
        });

        return;
    }

    gameSocket.emit('giveClue', clue.value);
    clue.value = '';
}
</script>

