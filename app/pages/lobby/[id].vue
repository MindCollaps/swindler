<template>
    <common-lobby-not-found v-if="lobbyNotFound"/>
    <div v-else-if="!store?.me?.loggedIn && socket.connected">
        <common-box><create-fake-user :lobby-id="lobbyId"/></common-box>
    </div>
    <div
        v-else-if="connected && store?.me?.loggedIn"
        class="lobby"
    >
        <div
            v-if="spectator"
            class="game-running"
        >
            The game is already running
            <div class="smol-info">wait for the round to end</div>
            <common-button @click="router.push(`/game/${ lobbyId }`)">Join as Spectator</common-button>
        </div>
        <div class="info">
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
        <player-list
            v-if="!spectator"
            :lobby="lobby"
            show-ready
        />
        <br>
        <dev-only>
            {{ JSON.stringify(store?.me) }}<br><br>{{ JSON.stringify(lobby) }}
        </dev-only>
        <avatar-creator
            :avatar
            :disabled="ready"
            size-x="400px"
            size-y="400px"
        />
        <div class="save-avatar-wrap"><common-button
            v-if="spectator"
            class="save-avatar"
            @click="saveAvatar"
        >Save Avatar</common-button></div>
        <div
            v-if="!spectator"
            class="wordlist-wrap"
        >
            Wordlists
            <div
                v-if="owner"
                class="wordlists"
            >
                <div
                    v-for="wordList in wordLists"
                    :key="wordList.name"
                    class="item"
                >
                    {{ wordList.name }}
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
            </div>
            <div
                v-else
                class="wordlists-basic"
            >
                <div
                    v-for="wordList in lobby?.wordLists"
                    :key="wordList"
                    class="item"
                >
                    {{ wordLists?.find(x => x.id === wordList)?.name }}
                </div>
            </div>
        </div>
        <template v-if="!spectator">
            <common-button
                :primary-color="ready ? 'error500' : 'success500'"
                @click="emitReady"
            >{{ ready ? 'Unready' : 'Ready' }}</common-button>
            <common-button
                v-if="owner && ready && allReady && !lobby?.gameStarted"
                class="start-button"
                primary-color="success500"
                @click="startGame()"
            >Start Game</common-button>
            <common-button
                v-if="owner && ready && allReady && lobby?.gameStarted && !lobby.gameRunning"
                class="start-button"
                primary-color="success500"
                @click="continueLobby()"
            >Continue</common-button>
        </template>
        <heart v-if="!spectator"/>
    </div>
    <div v-else>
        Loading
    </div>
</template>

<script setup lang="ts">
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

const store = useStore();

const route = useRoute();
const router = useRouter();
const lobbyId: string = route.params.id as string;
const uri = ref('');

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

const { copy } = useClipboard();
const uriInput = ref<any>(null);

const { lobbySocket, lobby, wordLists, connected, lobbyNotFound, spectator } = useLobbySocket(lobbyId);

function copyLink() {
    copy(uri.value);
    uriInput.value?.input?.select();
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

function startGame() {
    lobbySocket.emit('start');
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
    .save-avatar-wrap {
        display: flex;
        justify-content: center;

        .save-avatar {
            margin-top: 16px;
        }
    }

    .game-running {
        display: flex;
        flex-direction: column;
        align-items: center;

        margin-bottom: 32px;
        padding: 16px;
        border-radius: 16px;

        font-size: 2rem;
        color: $primary300;

        background: $darkgray900;

        .smol-info {
            margin-bottom: 16px;
            font-size: 1.4rem;
            color: $lightgray50;
            text-align: center;
        }
    }

    .lobby {
        padding: 16px;

        .start-button {
            margin-top: 16px;
        }

        .info {
            display: flex;
            gap: 8px;
            align-items: end;
            justify-content: center;

            margin-bottom: 16px;
        }

        .wordlists-basic {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;

            .item {
                padding: 8px;
                border: 2px solid $darkgray800;
                border-radius: 8px;
                background: $darkgray900;
            }
        }

        .wordlists {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
            margin-bottom: 16px;

            .item {
                display: flex;
                gap: 8px;
                align-items: center;
                justify-content: space-between;

                padding: 8px;
                border: 2px solid $darkgray800;
                border-radius: 8px;

                background: $darkgray900;

                .actions {
                    display: flex;
                    gap: 8px;
                }
            }
        }
    }
</style>
