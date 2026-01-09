<template>
    <div class="playerlist">
        <div class="heading">
            Players
        </div>
        <div
            v-if="lobby"
            class="playerlist-wrap"
        >
            <div
                v-if="showReady"
                class="ready"
            >
                Players {{ lobby.players.filter(x => x.ready).length }} / {{ lobby.players.length }} Ready
            </div>
            <div class="player-list">
                <div
                    v-for="player in sortedPlayers"
                    :key="player.id"
                    class="item"
                    :class="{
                        'current-turn': game?.turn === player.id && showTurn,
                        'is-me': isSameUser({ id: player.id, fakeUser: player.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false }),
                    }"
                    :style="{
                        '--avatar-size': avatarSize,
                        '--avatar-gap': gap,
                    }"
                >
                    <div class="avatar-username">
                        <avatar-model
                            v-if="player.ready && player.avatar"
                            :avatar="player.avatar"
                            :size-x="avatarSize + 'px'"
                            :size-y="avatarSize + 'px'"
                        />
                        <span v-if="isSameUser({ id: player.id, fakeUser: player.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false })">You</span>
                        <span v-else>{{ player.username }}</span>
                    </div>

                    <div
                        v-if="player.connected === false"
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
import AvatarModel from '../avatar/Avatar-Model.vue';

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
const avatarSize = '64';
const gap = '16';

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

    .playerlist-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .ready {
            font-weight: 600;
        }

        .player-list {
            display: flex;
            flex-direction: column;
            gap: 8px;

            padding: 16px;
            border-radius: 16px;

            background: $darkgray900;

            .item {
                display: flex;
                align-items: center;
                justify-content: space-between;

                height: calc(var(--avatar-size) * 1px + 8px);
                padding: 8px;
                border-radius: 16px;

                font-size: 14px;

                background: $darkgray950;

                .avatar-username {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    span {
                        margin-left: calc((var(--avatar-size) + var(--avatar-gap)) * 1px);
                    }
                }
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
