<template>
    <div>
        <common-input-text
            v-model="clue"
            @keyup.enter="sendClue"
        >Clue</common-input-text>
        <common-button @click="sendClue">Send</common-button>
    </div>

    <div v-if="showToast">
        <common-toast
            :is-visible="showToast"
            :type="toastMode"
            @close="showToast=false"
        >
            {{ toastMessage }}
        </common-toast>
    </div>
</template>

<script lang="ts" setup>
import { useGameSocket } from '~/composables/sockets/game';


const clue = ref('');

const showToast = ref(false);
const toastMessage = ref('');
const toastMode = ref<'error' | 'success' | 'info' | 'warning'>();

const route = useRoute();
const lobbyId = route.params.id as string;

const { gameSocket } = useGameSocket(lobbyId);

function sendClue() {
    if (clue.value.length < 1) {
        toastMessage.value = 'You have to give a clue!';
        toastMode.value = 'error';
        showToast.value = true;
        return;
    }

    gameSocket.emit('giveClue', clue.value);
    clue.value = '';
}
</script>

