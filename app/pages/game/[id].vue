<template>
    <div>
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
            Word: {{ game?.word }}
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
        {{ connected }}
    </div>
</template>

<script setup lang="ts">
import type { Lobby } from '~~/types/redis';
import { useLobbySocket, lobbySocket } from '../../composables/sockets/lobby';
import { useStore } from '~/store';

const lobby = shallowRef<Lobby>();
const route = useRoute();
const store = useStore();
const lobbyId = route.params.id as string;

const { game, connected } = useLobbySocket(lobbyId);

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

onMounted(() => {
    lobbySocket.emit('game');
});
</script>
