<template>
    <div class="playerlist">
        <div class="heading">
            Players
        </div>
        <div
            v-if="lobby"
            class="list"
        >
            <div
                v-if="showReady"
                class="ready"
            >
                Players {{ lobby.players.filter(x => x.ready).length }} / {{ lobby.players.length }} Ready
            </div>
            <div class=list>
                <div
                    v-for="player in sortedPlayers"
                    :key="player.id"
                    class="item"
                    :class="{ 
                        'current-turn': game?.turn === player.id && showTurn,
                        'is-me': isSameUser({ id: player.id, fakeUser: player.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false })
                    }"
                >
                    <span v-if="isSameUser({ id: player.id, fakeUser: player.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false })">You</span>
                    <span v-else>{{ player.username }}</span>

                    <div
                        v-if="!player.connected && player.connected !== undefined && player.connected !== null"
                        class="item-ready disconnected"
                    >Disconnected</div>
                    <div
                        v-else-if="showReady"
                        class="item-ready"
                    >{{ player.ready ? 'Ready' : 'Waiting...' }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { isSameUser } from '~/utils/user';
import { useGameSocket } from '~/composables/sockets/game';
import { useStore } from '~/store';

defineProps({
    showReady: {
        type: Boolean,
        default: false,
    },
    showTurn: {
        type: Boolean,
        default: false,
    },
});
const route = useRoute();
const lobbyId = route.params.id as string;

const store = useStore();
const { lobby, game } = useGameSocket(lobbyId);

const sortedPlayers = computed(() => {
    if (!lobby.value || !lobby.value.players) return [];

    const players = [...lobby.value.players];
    
    // During game, sort by turn order if available
    if (game.value?.turnOrder && game.value.turnOrder.length > 0) {
        return game.value.turnOrder
            .map(id => players.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => !!p);
    }
    
    return players;
});
</script>

<style scoped lang="scss">
.playerlist {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .heading {
        font-size: 1.2rem;
        font-weight: bold;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .ready {
            font-weight: 600;
        }

        .list {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .item {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
            }

            .item-ready {
                font-size: 12px;
                font-style: italic;
            }

            .item-ready.disconnected {
                color: $error500;
                background: none;
            }
        }
    }
}

.current-turn {
    font-weight: bold;
    color: $primary300;
}
</style>
