<template>
    <div v-if="connected">
        Round: {{ game?.round }}
        <div v-if="myTurn">
            Your Turn
        </div>
        <div v-else>
            {{ turnName }}'s turn
        </div>
        <br>
        Imposter: {{ game?.imposter ? 'yes' : 'no' }}
        <br>
        <div v-if="!game?.imposter">
            Word: {{ game?.word?.word }}
        </div>
        <br>
        Players
        <div>
            <div
                v-for="player in lobby?.players"
                :key="player.id"
            >
                {{ player.username }}
            </div>
        </div>
        <div v-if="myTurn">
            <common-input-text
                v-model="clue"
                @keyup.enter="sendClue"
            >Clue</common-input-text>
            <common-button @click="sendClue">Send</common-button>
        </div>
        <br>
        <br>
        <br>
        <div v-if="animateClue">
            {{ clueGiven?.player.username }} said {{ clueGiven?.clue }}
        </div>
    </div>
    <div v-else>
        Loading
    </div>
</template>

<script setup lang="ts">
import type { GivingClue } from '~~/types/redis';
import { useLobbySocket } from '../../composables/sockets/lobby';
import { useStore } from '~/store';
import type { ShallowRef } from 'vue';

const route = useRoute();
const store = useStore();
const lobbyId = route.params.id as string;

const { lobbySocket, game, connected, lobby } = useLobbySocket(lobbyId);

const clue = ref('');
const animateClue = ref(false);
const clueGiven: ShallowRef<GivingClue | undefined> = ref();

const myTurn: ComputedRef<boolean> = computed(() => {
    if (!store.me?.userid || !game.value?.turn) {
        return false;
    }

    return store.me.userid == game.value.turn;
});

const turnName: ComputedRef<string> = computed(() => {
    if (!game.value?.turn || !lobby.value?.players) {
        return '';
    }

    return lobby.value.players.find(x => x.id == game.value?.turn)?.username ?? '';
});

function sendClue() {
    lobbySocket.emit('giveClue', clue.value);
    clue.value = '';
}

function getClue(sentClue: GivingClue) {
    if (!animateClue.value) {
        clueGiven.value = sentClue;
        animateClue.value = true;

        setTimeout(() => {
            animateClue.value = false;
            lobbySocket.emit('game');
        }, 5000);
    }
    else {
        clueGiven.value = sentClue;
    }
}

onMounted(() => {
    lobbySocket.emit('game');
    lobbySocket.on('givingClue', value => {
        getClue(value);
    });
});

onUnmounted(() => {
    lobbySocket.off('givingClue');
});
</script>
