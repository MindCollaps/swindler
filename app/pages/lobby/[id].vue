<template>
    <div v-if="!store.me?.loggedIn && socket.connected">
        <create-fake-user :lobby-id="lobbyId"/>
    </div>
    <div v-else-if="connected && store.me?.loggedIn">
        Info
        <br>
        Round {{ lobby?.round }}<br>
        Started {{ lobby?.gameStarted }}<br>
        Running {{ lobby?.gameRunning }}<br>
        <br>
        {{ lobby?.token }}
        {{ lobby?.founder.username }}
        <br>
        <br>
        <player-list
            :lobby="lobby"
            show-ready
        />
        <br>
        <template v-if="store.me.developer">
            {{ JSON.stringify(store.me) }}
        </template>
        <br>
        Wordlists
        <div v-if="owner">
            <div
                v-for="wordList in wordLists"
                :key="wordList.name"
            >
                {{ wordList.name }}
                <div>
                    <common-button
                        v-if="lobby?.wordLists.filter(x => x === wordList.id).length === 0"
                        @click="addWordList(wordList.id)"
                    >Add</common-button>
                    <common-button
                        v-if="lobby?.wordLists.filter(x => x === wordList.id).length !== 0"
                        @click="removeWordList(wordList.id)"
                    >Remove</common-button>
                </div>
            </div>
        </div>
        <div v-else>
            <div
                v-for="wordList in lobby?.wordLists"
                :key="wordList"
            >
                {{ wordLists?.find(x => x.id === wordList)?.name }}
            </div>
        </div>
        <common-button @click="emitReady">{{ ready ? 'Unready' : 'Ready' }}</common-button>
        <common-button
            v-if="owner && ready && allReady"
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

const store = useStore();

const route = useRoute();
const lobbyId: string = route.params.id as string;

const { lobbySocket, lobby, wordLists, connected } = useLobbySocket(lobbyId);

const owner: ComputedRef<boolean> = computed(() => {
    if (!lobby.value?.founder.id || !store.me?.userid) {
        return false;
    }
    return lobby.value?.founder.id == store.me?.userid && lobby.value?.founder.fakeUser == store.me?.fakeUser;
});

const ready: ComputedRef<boolean> = computed(() => {
    if (!lobby.value?.players) {
        return false;
    }

    const me = lobby.value.players.find(x => x.id == store.me?.userid);
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

    const me = lobby.value?.players.find(x => x.id == store.me?.userid);
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
