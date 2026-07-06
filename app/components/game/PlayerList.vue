<template>
    <div class="playerlist">
        <h2 class="heading">
            Players
        </h2>
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
            <transition-group
                class="player-list"
                name="roster"
                tag="div"
            >
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
                        <div class="avatar-slot">
                            <avatar-model
                                :avatar="player.avatar"
                                :size-x="avatarSize + 'px'"
                                :size-y="avatarSize + 'px'"
                            />
                        </div>
                        <span
                            v-if="isSameUser({ id: player.id, fakeUser: player.fakeUser }, { id: store.me?.userid ?? 0, fakeUser: store.me?.fakeUser ?? false })"
                            class="name"
                        >You</span>
                        <span
                            v-else
                            class="name"
                        >{{ player.username }}</span>
                    </div>

                    <transition
                        mode="out-in"
                        name="status-fade"
                    >
                        <div
                            v-if="player.connected === false"
                            key="disconnected"
                            class="item-ready disconnected"
                        >Disconnected</div>
                        <div
                            v-else-if="showReady"
                            :key="player.ready ? 'ready' : 'waiting'"
                            class="item-ready"
                        >{{ player.ready ? 'Ready' : 'Waiting...' }}</div>
                    </transition>
                    <common-typing v-if="isTyping && game?.turn === player.id && showTurn"/>
                </div>
            </transition-group>
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

const isTyping = ref(false);

const { gameSocket } = useGameSocket(lobbyId);

gameSocket.on('startTyping', () => {
    isTyping.value = true;
});

gameSocket.on('stopTyping', () => {
    isTyping.value = false;
});
</script>

<style scoped lang="scss">
.playerlist {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .heading {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
    }

    .playerlist-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .ready {
            font-weight: 600;
        }

        .player-list {
            position: relative;

            display: flex;
            flex-direction: column;
            gap: 8px;

            padding: 16px;
            border-radius: 8px;

            background: $darkgray900;

            .item {
                display: flex;
                align-items: center;
                justify-content: space-between;

                height: calc(var(--avatar-size) * 1px + 8px);
                padding: 8px;
                border-radius: 8px;

                font-size: 14px;

                background: $darkgray950;

                transition: background-color 0.25s $easeOutQuart, color 0.25s $easeOutQuart, opacity 0.3s $easeOutQuart, transform 0.3s $easeOutQuart;

                &.roster-enter-from {
                    transform: translateY(8px) scale(0.98);
                    opacity: 0;
                }

                &.roster-leave-active {
                    position: absolute;
                    right: 0;
                    left: 0;
                }

                &.roster-leave-to {
                    transform: scale(0.96);
                    opacity: 0;
                }

                .avatar-username {
                    display: flex;
                    gap: calc(var(--avatar-gap) * 1px);
                    align-items: center;
                    min-width: 0;

                    .avatar-slot {
                        position: relative;
                        flex-shrink: 0;
                        width: calc(var(--avatar-size) * 1px);
                        height: calc(var(--avatar-size) * 1px);
                    }

                    .name {
                        min-width: 0;
                        overflow-wrap: anywhere;
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

.status-fade-enter-active, .status-fade-leave-active {
    transition: opacity 0.2s $easeOutQuart;
}

.status-fade-enter-from, .status-fade-leave-to {
    opacity: 0;
}
</style>
