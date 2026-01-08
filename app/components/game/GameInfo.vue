<template>
    <div class="info">
        <div
            v-if="!onlyWord"
            class="round"
        >
            Round {{ game?.round }}
        </div>
        <div
            v-if="!onlyWord"
            class="game-number"
        >
            Game {{ lobby?.gameNumber }}
        </div>
        <div
            v-if="!game?.imposter"
            class="word"
        >
            {{ game?.word?.word }} <span v-if="game?.word?.wordListName" class="word-list">({{ game?.word?.wordListName }})</span>
        </div>
        <template v-if="!onlyWord">
            <div
                v-if="myTurn"
                class="myturn"
            >
                Your Turn
            </div>
            <div
                v-else
                class="othersturn"
            >
                {{ turnName }}'s turn
            </div>
            <div
                v-if="game?.imposter"
                class="imposter"
            >
                You are the imposter!
            </div>
            <div
                v-else
                class="notimposter"
            >You are not the imposter</div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Lobby, LobbyGame } from '~~/types/redis';

defineProps({
    game: Object as PropType<LobbyGame | null>,
    lobby: Object as PropType<Lobby | null>,
    myTurn: Boolean,
    turnName: String,
    onlyWord: {
        type: Boolean,
        default: false,
    },
});
</script>

<style scoped lang="scss">
.info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 32px;

    .game-number {
        grid-column: 2;
        margin-bottom: 16px;
        text-align: center;
    }

    .round {
        grid-column: 2;
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
    }

    .word-list {
        font-weight: normal;
        font-size: 0.8em;
        opacity: 0.7;
    }

    .myturn {
        grid-column: 1;
        font-weight: bold;
        color: $success500;
    }

    .othersturn {
        grid-column: 1;
        font-weight: bold;
        color: $primary300;
    }

    .imposter {
        grid-column: 1;
        font-weight: bold;
        color: $error500;
    }

    .notimposter {
        grid-column: 1;
        font-weight: bold;
        color: $success300;
    }

    .word {
        grid-column: 2;

        padding: 16px;
        border-radius: 16px;

        font-size: 3rem;
        text-align: center;

        background: $darkgray900;
    }
}
</style>
