<template>
    <div v-if="connected">
        <template v-if="game?.gameState === GameState.Round">
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
            <player-list :lobby="lobby"/>
            <br>
            <br>
            <clue
                v-if="myTurn"
                :lobby-id="lobbyId"
            />
        </template>
        <template v-if="game?.gameState === GameState.Idle">
            Waiting for game to start...
        </template>
        <template v-if="game?.gameState === GameState.Cue">
            {{ clue?.player.username }} said {{ clue?.clue }}
            <vote :lobby-id="lobbyId"/>
        </template>
        <template v-if="game?.gameState === GameState.RoundEnd">
            Round ended.
        </template>
        <template v-if="game?.gameState === GameState.GameEnd">
            Game ended!
            Pretend like you see fancy statistics here please :3
        </template>
        <heart :lobby-id="lobbyId"/>
    </div>
    <div v-else>
        Loading
    </div>
</template>

<script setup lang="ts">
import Heart from '~/components/game/Heart.vue';
import PlayerList from '~/components/game/PlayerList.vue';
import Vote from '~/components/game/Vote.vue';
import Clue from '~/components/game/Clue.vue';
import { GameState } from '~~/types/redis';
import { useGameSocket } from '~/composables/sockets/game';

const route = useRoute();

const lobbyId = route.params.id as string;

const { gameSocket: gameSocket, game, connected, lobby, myTurn, clue } = useGameSocket(lobbyId);

const turnName: ComputedRef<string> = computed(() => {
    if (!game.value?.turn || !lobby.value?.players) {
        return '';
    }

    return lobby.value.players.find(x => x.id == game.value?.turn)?.username ?? '';
});

onMounted(() => {
    gameSocket.emit('game');
});
</script>

<style lang="scss">
.heart {
    pointer-events: none;

    position: fixed;
    z-index: 1000;
    bottom: 1vh;
    left: 95vw;

    font-size: 2rem;
    color: #ff6b9d;

    opacity: 1;
}
</style>
