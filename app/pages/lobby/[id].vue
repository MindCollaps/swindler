<template>
    <common-lobby-not-found v-if="lobbyNotFound"/>
    <div v-else-if="!store?.me?.loggedIn && socket.connected">
        <create-fake-user :lobby-id="lobbyId"/>
    </div>
    <div
        v-else-if="connected && store?.me?.loggedIn"
        class="lobby"
    >
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
            :lobby="lobby"
            show-ready
        />
        <br>
        <template v-if="store?.me?.developer">
            {{ JSON.stringify(store?.me) }}
        </template>
        <br>
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
        <common-button
            :primary-color="ready ? 'error500' : 'success500'"
            @click="emitReady"
        >{{ ready ? 'Unready' : 'Ready' }}</common-button>
        <common-button
            v-if="owner && ready && allReady"
            class="start-button"
            primary-color="success500"
            @click="startGame()"
        >Start Game</common-button>
    </div>
    <div v-else>
        Loading
    </div>
</template>

<script setup lang="ts">
import { useLobbySocket } from '~/composables/sockets/lobby';
import { useStore } from '~/store';
import { socket } from '~/components/socket';
import CreateFakeUser from '~/components/game/CreateFakeUser.vue';
import PlayerList from '~/components/game/PlayerList.vue';
import { useClipboard } from '@vueuse/core';

const store = useStore();

const route = useRoute();
const lobbyId: string = route.params.id as string;
const uri = ref('');

onMounted(() => {
    uri.value = `${ window.location.origin }/lobby/${ lobbyId }`;
});

const { copy } = useClipboard();
const uriInput = ref<any>(null);

function copyLink() {
    copy(uri.value);
    uriInput.value?.input?.select();
}

const { lobbySocket, lobby, wordLists, connected, lobbyNotFound } = useLobbySocket(lobbyId);

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
    if (!lobby.value) {
        nextTick(() => lobbySocket.emit('lobby'));
    }
});

function emitReady() {
    lobbySocket.emit('ready', !ready.value);

    const me = lobby.value?.players.find(x => x.id == store?.me?.userid);
    if (me) me.ready = !ready.value;
}

function startGame() {
    lobbySocket.emit('start');
}

function addWordList(id: number) {
    lobbySocket.emit('addWord', id);
}

function removeWordList(id: number) {
    lobbySocket.emit('removeWord', id);
}
</script>

<style scoped lang='scss'>
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
