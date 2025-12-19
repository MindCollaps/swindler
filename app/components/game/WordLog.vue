<template>
    <div>
        <h2 class="chat-heading">Words Said</h2>
        <div class="chat">
            <div
                v-for="msg in messages"
                :key="`${ msg.round }-${ msg.turn }`"
                class="message"
            >
                <span class="name">{{ msg.username }}:</span>
                <span class="word">{{ msg.word }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useGameSocket } from '~/composables/sockets/game';

const route = useRoute();
const lobbyId = route.params.id as string;

const { lobby } = useGameSocket(lobbyId);

const messages = computed(() => {
    if (!lobby.value) return [];

    const currentGameNumber = lobby.value.gameNumber;

    return lobby.value.wordsSaid
        .filter(w => w.gameNumber === currentGameNumber)
        .map(w => {
            const player = lobby.value?.players.find(p => p.id === w.playerId);
            return {
                username: player ? player.username : 'Unknown',
                word: w.word,
                round: w.round,
                turn: w.turn,
            };
        })
        .reverse();
});
</script>

<style scoped lang="scss">
.chat-heading {
    margin-bottom: 0.5rem;
}

.chat {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    max-height: 300px;
    padding: 1rem;
    border-radius: 0.5rem;

    background-color: rgb(0, 0, 0, 0.1);

    .message {
        display: flex;
        gap: 0.5rem;

        .name {
            font-weight: bold;
        }
    }
}
</style>
