<template>
    <div class="lobby-end">
        <h1>Lobby Ended</h1>
        <p>Thanks for playing!</p>

        <div
            v-if="displayStats.length > 0"
            class="stats-grid"
        >
            <div
                v-for="stat in displayStats"
                :key="stat.title"
                class="stat-box"
                :class="stat.class"
            >
                <h3>{{ stat.title }}</h3>
                <div class="player-name">{{ stat.player?.username }}</div>
                <div class="count">{{ stat.count }} {{ stat.unit }}</div>
            </div>
        </div>
        <div v-else>
            No interesting stats this game!
        </div>

        <common-button
            class="home-btn"
            to="/"
        >Back to Home</common-button>

        <word-log/>
    </div>
</template>

<script setup lang="ts">
import WordLog from '~/components/game/WordLog.vue';
import type { GameStateEmits } from '~~/types/game-state';
import type { Lobby } from '~~/types/redis';

const props = defineProps<{
    lobby?: Lobby;
}>();

defineEmits<GameStateEmits>();

const displayStats = computed(() => {
    return props.lobby?.stats || [];
});
</script>

<style scoped lang="scss">
.lobby-end {
    display: flex;
    flex-direction: column;
    align-items: center;

    padding: 20px;

    text-align: center;
}

.stats-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;

    width: 100%;
    max-width: 1200px;
    margin: 20px 0;
}

.stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    width: 20vmax;
    height: 20vmax;
    padding: 20px;
    border: 2px solid transparent;
    border-radius: 16px;

    background: $darkgray800;

    h3 {
        margin-bottom: 10px;
        font-size: 1.2rem;
    }

    .player-name {
        margin-bottom: 5px;
        font-size: 1.5rem;
        font-weight: bold;
        color: #fff;
    }

    .count {
        font-weight: bold;
    }

    &.success {
        border-color: $success500;

        h3 {
            color: $success500;
        }

        .count {
            color: $success500;
        }
    }

    &.error {
        border-color: $error500;

        h3 {
            color: $error500;
        }

        .count {
            color: $error500;
        }
    }

    &.primary {
        border-color: $primary500;

        h3 {
            color: $primary500;
        }

        .count {
            color: $primary500;
        }
    }

    &.warning {
        border-color: $warning500;

        h3 {
            color: $warning500;
        }

        .count {
            color: $warning500;
        }
    }

    &.info {
        border-color: $info500;

        h3 {
            color: $info500;
        }

        .count {
            color: $info500;
        }
    }
}

.home-btn {
    margin: 20px 0;
}
</style>
