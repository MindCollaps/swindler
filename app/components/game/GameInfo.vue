<template>
    <div class="info">
        <div
            v-if="!onlyWord"
            class="meta"
        >
            <span>Game {{ lobby?.gameNumber }}</span>
            <span class="dot">·</span>
            <span>Round {{ game?.round }}</span>
        </div>
        <role-card
            class="role-slot"
            :game="game"
        />
        <div
            v-if="!onlyWord"
            class="turn"
            :class="{ 'turn--mine': myTurn }"
        >
            {{ myTurn ? 'Your Turn' : `${ turnName }'s turn` }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Lobby, LobbyGame } from '~~/types/redis';
import RoleCard from '~/components/game/RoleCard.vue';

defineProps({
    game: Object as PropType<LobbyGame | null>,
    lobby: Object as PropType<Lobby | null>,
    myTurn: Boolean,
    turnName: String,
    onlyWord: {
        type: Boolean,
        default: false,
    },
    spectator: Boolean,
});
</script>

<style scoped lang="scss">
.info {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;

    margin-bottom: 32px;
    padding: 16px;
    border-radius: 8px;

    background: $darkgray900;

    .meta {
        font-size: 13px;
        font-weight: 600;
        color: $lightgray300;

        .dot {
            margin: 0 4px;
        }
    }

    .turn {
        font-size: 24px;
        font-weight: 600;
        color: $lightgray150;
        text-align: center;
    }

    .turn--mine {
        color: $primary300;
    }
}
</style>
