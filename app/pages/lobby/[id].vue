<template>
    <div v-if="connected">
        Info
        <br>
        Round {{ lobby?.round }}<br>
        Started {{ lobby?.gameStarted }}<br>
        Running {{ lobby?.gameRunning }}<br>
        <br>
        {{ lobby?.token }}
        {{ lobby?.founder.username }}
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
        <common-button
            v-if="owner"
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

const store = useStore();

const route = useRoute();
const lobbyId: string = route.params.id as string;

const { lobbySocket, lobby, wordLists, connected } = useLobbySocket(lobbyId);

const owner: ComputedRef<boolean> = computed(() => {
    if (!lobby.value?.founder.id || !store.me?.userid) {
        return false;
    }
    return lobby.value?.founder.id == store.me?.userid;
});

onMounted(() => {
    if (!lobby.value) {
        lobbySocket.emit('lobby');
    }
});

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
