<template>
    <common-lobby-not-found v-if="lobbyNotFound"/>
    <div v-else-if="!store?.me?.loggedIn && socket.connected">
        <common-box><create-fake-user :lobby-id="lobbyId"/></common-box>
    </div>
    <div
        v-else-if="connected && store?.me?.loggedIn"
        class="lobby"
    >
        <div class="lobby-inner">
            <div
                v-if="spectator"
                class="panel game-running"
            >
                The game is already running
                <div class="smol-info">wait for the round to end</div>
                <common-button @click="router.push(`/game/${ lobbyId }`)">Join as Spectator</common-button>
            </div>

            <section class="panel invite-panel">
                <h2 class="section-heading">Invite Friends</h2>
                <div class="invite-row">
                    <common-input-text
                        ref="uriInput"
                        v-model="uri"
                        readonly
                    >
                        Lobby ID
                    </common-input-text>
                    <common-button
                        @click="copyLink"
                    >Copy Lobby Link</common-button>
                </div>
                <div class="qr-row">
                    <transition name="qr-pop">
                        <qrcode
                            v-if="showQr"
                            :size="store.isMobile ? 200 : 300"
                            :value="uri"
                        />
                    </transition>
                    <common-button
                        icon="material-symbols:qr-code"
                        width="40px"
                        @click="showQr = !showQr"
                    />
                </div>
            </section>

            <section
                v-if="!spectator"
                class="panel players-panel"
            >
                <player-list
                    :lobby="lobby"
                    show-ready
                />
            </section>

            <section class="panel avatar-panel">
                <h2 class="section-heading">Your Look</h2>
                <avatar-creator
                    :avatar
                    :disabled="ready"
                    :size-x="store.isMobile ? '200px' : '280px'"
                    :size-y="store.isMobile ? '200px' : '280px'"
                />
                <common-button
                    v-if="spectator"
                    class="save-avatar"
                    @click="saveAvatar"
                >Save Avatar</common-button>
            </section>

            <section
                v-if="!spectator"
                class="panel wordlists-panel"
            >
                <h2 class="section-heading">Wordlists</h2>
                <template v-if="owner">
                    <common-loader
                        v-if="!wordLists"
                        smol
                    />
                    <p
                        v-else-if="wordLists.length === 0"
                        class="wordlists-empty"
                    >No wordlists yet. Create one on the Wordlists page and it will show up here.</p>
                    <transition-group
                        v-else
                        class="wordlists"
                        name="wordlist-item"
                        tag="div"
                    >
                        <div
                            v-for="wordList in wordLists"
                            :key="wordList.name"
                            class="item"
                        >
                            <span class="name">{{ wordList.name }}</span>
                            <div class="actions">
                                <common-button
                                    v-if="lobby?.wordLists.filter(x => x === wordList.id).length === 0"
                                    primary-color="success500"
                                    @click="addWordList(wordList.id)"
                                >Add</common-button>
                                <common-button
                                    v-if="lobby?.wordLists.filter(x => x === wordList.id).length !== 0"
                                    primary-color="error500"
                                    @click="removeWordList(wordList.id)"
                                >Remove</common-button>
                            </div>
                        </div>
                    </transition-group>
                </template>
                <div
                    v-else
                    class="wordlists-basic"
                >
                    <p
                        v-if="!lobby?.wordLists?.length"
                        class="wordlists-empty"
                    >The host has not picked any wordlists yet.</p>
                    <transition-group
                        class="wordlist-basic-list"
                        name="wordlist-item"
                        tag="div"
                    >
                        <div
                            v-for="wordList in lobby?.wordLists"
                            :key="wordList"
                            class="item"
                        >
                            <span class="name">{{ wordLists?.find(x => x.id === wordList)?.name ?? 'Unknown wordlist' }}</span>
                        </div>
                    </transition-group>
                </div>
            </section>

            <section
                v-if="!spectator"
                class="panel actions-panel"
                :class="{ 'actions-panel--ready': allReady }"
            >
                <common-button
                    width="100%"
                    :primary-color="ready ? 'error500' : 'success500'"
                    @click="emitReady"
                >{{ ready ? 'Unready' : 'Ready' }}</common-button>
                <transition name="start-reveal">
                    <common-button
                        v-if="owner && ready && allReady && !lobby?.gameStarted"
                        width="100%"
                        class="start-button"
                        :disabled="starting"
                        primary-color="success500"
                        @click="startGame()"
                    >{{ starting ? 'Starting...' : 'Start Game' }}</common-button>
                </transition>
                <p
                    v-if="owner && !lobby?.gameStarted && startHint"
                    class="start-hint"
                >{{ startHint }}</p>
                <transition name="start-reveal">
                    <common-button
                        v-if="owner && ready && allReady && lobby?.gameStarted && !lobby.gameRunning"
                        width="100%"
                        class="start-button"
                        primary-color="success500"
                        @click="continueLobby()"
                    >Continue</common-button>
                </transition>
            </section>

            <dev-only>
                <div class="debug-dump">
                    {{ JSON.stringify(store?.me) }}<br><br>{{ JSON.stringify(lobby) }}
                </div>
            </dev-only>
        </div>
        <heart v-if="!spectator"/>
    </div>
    <div
        v-else-if="connectionError"
        class="connection-lost"
    >
        <common-box>
            <h1>Can't reach the game server</h1>
            <p v-if="lobby">Your connection dropped. The lobby is still there - check your internet and jump back in.</p>
            <p v-else>The lobby might be fine - your connection isn't. Check your internet and try again.</p>
            <common-button @click="retry">Try Again</common-button>
        </common-box>
    </div>
    <div
        v-else
        class="lobby-loading"
        role="status"
    >
        <common-loader smol/>
        <p>{{ lobby ? 'Reconnecting...' : 'Joining lobby...' }}</p>
    </div>
</template>

<script setup lang="ts">
import Qrcode from 'qrcode.vue';
import { useLobbySocket } from '~/composables/sockets/lobby';
import Heart from '~/components/game/Heart.vue';
import { useStore } from '~/store';
import { socket } from '~/components/socket';
import CreateFakeUser from '~/components/game/CreateFakeUser.vue';
import PlayerList from '~/components/game/PlayerList.vue';
import { useClipboard, useLocalStorage } from '@vueuse/core';
import AvatarCreator from '~/components/avatar/Avatar-Creator.vue';
import type { Avatar } from '~~/types/data';
import CommonBox from '~/components/common/CommonBox.vue';
import { ToastMode } from '~~/types/toast';

const store = useStore();
const { showToast } = useToastManager();
const route = useRoute();
const router = useRouter();
const lobbyId: string = route.params.id as string;
const uri = ref('');
const showQr = ref(false);

const avatar: Ref<Avatar> = ref({
    body: 4,
    eyes: 6,
    cloth: 2,
    mouth: 2,
    hair: 6,
    accessory1: 3,
    accessory2: undefined,
});

const avatarStorage = useLocalStorage<Avatar>('avatar', {
    body: 4,
    eyes: 6,
    cloth: 2,
    mouth: 2,
    hair: 6,
    accessory1: 3,
    accessory2: undefined,
});

const { copy } = useClipboard({ legacy: true });
const uriInput = ref<any>(null);

const { lobbySocket, lobby, wordLists, connected, lobbyNotFound, connectionError, retry, spectator } = useLobbySocket(lobbyId);

async function copyLink() {
    uriInput.value?.input?.select();
    try {
        await copy(uri.value);
        showToast({
            mode: ToastMode.Success,
            message: 'Lobby link copied. Send it to your friends.',
            duration: 4000,
        });
    }
    catch {
        showToast({
            mode: ToastMode.Info,
            message: 'Copying is blocked here. The link is selected above - copy it manually.',
            duration: 6000,
        });
    }
}

const owner: ComputedRef<boolean> = computed(() => {
    if (!lobby.value?.founder.id || !store?.me?.userid) {
        return false;
    }
    return lobby.value?.founder.id == store?.me?.userid && lobby.value?.founder.fakeUser == store?.me?.fakeUser;
});

const ready: ComputedRef<boolean> = computed(() => {
    if (!lobby.value?.players) {
        return false;
    }

    const me = lobby.value.players.find(x => x.id == store?.me?.userid);
    if (!me) {
        return false;
    }

    return me.ready;
});

const allReady: ComputedRef<boolean> = computed(() => {
    return lobby.value?.players.filter(x => x.ready).length == lobby.value?.players.length;
});

const startHint: ComputedRef<string> = computed(() => {
    if (!lobby.value) return '';
    const count = lobby.value.players.length;
    if (count < 2) return 'Waiting for players - share the lobby link above';
    const readyCount = lobby.value.players.filter(x => x.ready).length;
    if (readyCount < count) return `Start unlocks when everyone is ready (${ readyCount }/${ count })`;
    if (!lobby.value.wordLists?.length) return 'Pick at least one wordlist to start';
    return '';
});

onMounted(() => {
    uri.value = `${ window.location.origin }/lobby/${ lobbyId }`;
    if (!lobby.value) {
        nextTick(() => lobbySocket.emit('lobby'));
    }

    if (avatarStorage.value) {
        avatar.value = avatarStorage.value;
    }
});

function saveAvatar() {
    avatarStorage.value = avatar.value;
}

function emitReady() {
    lobbySocket.emit('ready', { avatar: avatar.value, ready: !ready.value });

    const me = lobby.value?.players.find(x => x.id == store?.me?.userid);
    if (me) {
        me.ready = !ready.value;
        me.avatar = avatar.value;
        avatarStorage.value = avatar.value;
    }
}

const starting = ref(false);

function startGame() {
    if (!lobby.value || lobby.value?.players.length < 2) {
        showToast({
            mode: ToastMode.Error,
            message: 'Not enough players to start - share the lobby link',
        });
        return;
    }
    if (!lobby.value.wordLists || lobby.value.wordLists.length < 1) {
        showToast({
            mode: ToastMode.Error,
            message: 'Pick at least one wordlist before starting',
        });
        return;
    }
    if (starting.value) return;
    starting.value = true;
    lobbySocket.emit('start');
    // Re-enable if the server rejects the start instead of broadcasting it
    setTimeout(() => {
        starting.value = false;
    }, 4000);
}

function continueLobby() {
    lobbySocket.emit('continue');
}

function addWordList(id: number) {
    lobbySocket.emit('addWord', id);
}

function removeWordList(id: number) {
    lobbySocket.emit('removeWord', id);
}
</script>

<style scoped lang='scss'>
    .game-running {
        display: flex;
        flex-direction: column;
        align-items: center;

        font-size: 2rem;
        color: $primary300;

        .smol-info {
            margin-bottom: 16px;
            font-size: 1.4rem;
            color: $lightgray50;
            text-align: center;
        }
    }

    .lobby-loading {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;

        padding: 64px 16px;

        color: $lightgray150;
    }

    .connection-lost {
        h1 {
            font-size: 24px;
        }

        p {
            font-size: 14px;
            color: $lightgray150;
        }
    }

    .lobby {
        padding: 16px 16px 48px;

        // Clears the fixed heart button (bottom-right FAB) so it never
        // sits over the last panel's content when scrolled to the end.
        @include mobile {
            padding-bottom: 96px;
        }

        @include pc {
            padding: 32px 32px 64px;
        }
    }

    .lobby-inner {
        display: flex;
        flex-direction: column;
        gap: 24px;

        max-width: 720px;
        margin: 0 auto;

        @include pc {
            gap: 32px;
        }
    }

    .panel {
        padding: 20px;
        border: 1px solid $darkgray600;
        border-radius: 8px;
        background: $darkgray800;

        @include pc {
            padding: 32px;
        }
    }

    .section-heading {
        margin: 0 0 16px;
        font-size: 24px;
        font-weight: 600;
    }

    .invite-panel {
        .invite-row {
            display: flex;
            gap: 8px;
            align-items: end;
        }

        .qr-row {
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;

            margin-top: 16px;
        }
    }

    .avatar-panel {
        display: flex;
        flex-direction: column;
        align-items: center;

        .save-avatar {
            margin-top: 16px;
        }
    }

    .wordlists-panel {
        .wordlists-empty {
            font-size: 14px;
            color: $lightgray300;
        }

        .wordlists-basic {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .wordlist-basic-list {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 8px;

            .item {
                padding: 8px 12px;
                border: 1px solid $darkgray700;
                border-radius: 8px;

                background: $darkgray875;

                transition: opacity 0.25s $easeOutQuart, transform 0.25s $easeOutQuart;

                .name {
                    overflow-wrap: anywhere;
                }

                &.wordlist-item-enter-from {
                    transform: translateY(-6px);
                    opacity: 0;
                }

                &.wordlist-item-leave-active {
                    position: absolute;
                    right: 0;
                    left: 0;
                }

                &.wordlist-item-leave-to {
                    transform: scale(0.95);
                    opacity: 0;
                }
            }
        }

        .wordlists {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 8px;

            @include mobileOnly() {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }

            .item {
                display: flex;
                gap: 8px;
                align-items: center;
                justify-content: space-between;

                padding: 8px 12px;
                border: 1px solid $darkgray700;
                border-radius: 8px;

                background: $darkgray875;

                transition: opacity 0.25s $easeOutQuart, transform 0.25s $easeOutQuart;

                .name {
                    min-width: 0;
                    font-size: 14px;
                    overflow-wrap: anywhere;
                }

                .actions {
                    display: flex;
                    flex-shrink: 0;
                    gap: 8px;
                }

                &.wordlist-item-enter-from {
                    transform: scale(0.92);
                    opacity: 0;
                }

                &.wordlist-item-leave-to {
                    transform: scale(0.92);
                    opacity: 0;
                }
            }
        }
    }

    .actions-panel {
        display: flex;
        flex-direction: column;

        margin-top: 8px;
        border-color: $primary700;

        transition: border-color 0.4s $easeOutQuart;

        .start-button {
            margin-top: 12px;
        }

        .start-hint {
            margin: 8px 0 0;
            font-size: 14px;
            color: $lightgray300;
            text-align: center;
        }
    }

    .actions-panel--ready {
        border-color: $success500;
    }

    .start-reveal-enter-active {
        animation: start-pop 0.4s $easeOutQuart;
    }

    .start-reveal-leave-active {
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .start-reveal-leave-to {
        transform: scale(0.95);
        opacity: 0;
    }

    @keyframes start-pop {
        from {
            transform: scale(0.9);
            opacity: 0;
            filter: brightness(1.6);
        }

        to {
            transform: scale(1);
            opacity: 1;
            filter: brightness(1);
        }
    }

    .qr-pop-enter-active, .qr-pop-leave-active {
        transition: opacity 0.25s $easeOutQuart, transform 0.25s $easeOutQuart;
    }

    .qr-pop-enter-from, .qr-pop-leave-to {
        transform: scale(0.9) translateY(-6px);
        opacity: 0;
    }

    .debug-dump {
        margin-top: 8px;
        font-size: 12px;
        color: $lightgray400;
        word-break: break-all;
    }
</style>
