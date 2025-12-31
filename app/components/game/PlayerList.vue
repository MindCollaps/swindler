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
                    class="item"
                    :class="game?.turn === store.me?.userid && showTurn ? 'current-turn' : ''"
                >
                    You
                    <div
                        v-if="showReady"
                        class="item-ready"
                    >{{ lobby.players.find(x => isSameUser({ id: x.id, fakeUser: x.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false }))?.ready ? 'Ready' : 'Waiting...' }}</div>
                </div>
                <div
                    v-for="player in lobby.players.filter(x => !isSameUser({ id: x.id, fakeUser: x.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false }))"
                    :key="player.id"
                    class="item"
                    :class="game?.turn === player.id && showTurn ? 'current-turn' : ''"
                >
                    {{ player.username }}
                    <div
                        v-if="showReady"
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

const { lobby, game } = useGameSocket(lobbyId);

const store = useStore();
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
        }
    }
}

.current-turn {
    font-weight: bold;
    color: $primary300;
}
</style>
