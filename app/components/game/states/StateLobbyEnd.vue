<template>
    <div class="lobby-end">
        <h1>Lobby Ended</h1>
        <p>Thanks for playing!</p>

        <div
            v-if="displayStats.length > 0"
            class="stats-grid"
        >
            <div
                v-for="(stat, index) in displayStats"
                :key="stat.title"
                class="stat-box"
                :class="stat.class"
                :style="{ '--i': index }"
            >
                <Icon
                    class="stat-icon"
                    :name="statIcon(stat.title)"
                />
                <h3>{{ stat.title }}</h3>
                <div class="player-name">{{ stat.player?.username }}</div>
                <div class="count">{{ stat.count }} {{ stat.unit }}</div>
            </div>
        </div>
        <div
            v-else
            class="no-stats"
        >
            No interesting stats this game!
        </div>

        <common-button
            class="home-btn"
            :to="`/lobby/${ lobby?.token }`"
        >Back to Lobby</common-button>
    </div>
</template>

<script setup lang="ts">
import type { GameStateEmits } from '~~/types/game-state';
import type { Lobby } from '~~/types/redis';

const props = defineProps<{
    lobby?: Lobby;
}>();

defineEmits<GameStateEmits>();

const displayStats = computed(() => {
    return props.lobby?.stats || [];
});

const statIcons: Record<string, string> = {
    'Best Detective': 'material-symbols:search',
    'Worst Detective': 'material-symbols:sentiment-dissatisfied',
    'Best Swindler': 'material-symbols:theater-comedy',
    'Most Wins': 'material-symbols:emoji-events',
    'Most Loved': 'material-symbols:favorite',
    'Most Sus': 'material-symbols:visibility',
    'Most Paranoid': 'material-symbols:priority-high',
    Wordsmith: 'material-symbols:edit-note',
};

function statIcon(title: string): string {
    return statIcons[title] ?? 'material-symbols:star';
}
</script>

<style scoped lang="scss">
.lobby-end {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 24px;

    text-align: center;

    h1 {
        margin: 0;
        font-size: 38px;
        font-weight: bold;
        animation: fade-up 0.35s $easeOutQuint both;

        @include mobile {
            font-size: 32px;
        }
    }

    p {
        margin: 8px 0 0;
        font-size: 14px;
        animation: fade-up 0.35s $easeOutQuint 0.08s both;
    }
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;

    width: 100%;
    max-width: 720px;
    margin: 24px 0;
}

.stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    min-height: 160px;
    padding: 24px;
    border: 2px solid transparent;
    border-radius: 8px;

    background: $darkgray800;

    animation: fade-up 0.35s $easeOutQuint both;
    animation-delay: calc(0.16s + var(--i, 0) * 50ms);

    .stat-icon {
        width: 28px;
        height: 28px;
        margin-bottom: 8px;
    }

    h3 {
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 600;
        color: $lightgray150;
    }

    .player-name {
        margin-bottom: 16px;

        font-size: 24px;
        font-weight: bold;
        color: $lightgray0;
        overflow-wrap: anywhere;
    }

    .count {
        font-weight: bold;
        color: $lightgray50;
    }

    &.success {
        border-color: $success300;

        .stat-icon {
            color: $success300;
        }
    }

    &.error {
        border-color: $error300;

        .stat-icon {
            color: $error300;
        }
    }

    &.primary {
        border-color: $primary300;

        .stat-icon {
            color: $primary300;
        }
    }

    &.warning {
        border-color: $warning300;

        .stat-icon {
            color: $warning300;
        }
    }

    &.info {
        border-color: $info300;

        .stat-icon {
            color: $info300;
        }
    }
}

.no-stats {
    margin: 24px 0;
    font-size: 14px;
    color: $lightgray300;
    animation: fade-up 0.35s $easeOutQuint 0.16s both;
}

.home-btn {
    margin: 20px 0;
    animation: fade-up 0.35s $easeOutQuint 0.3s both;
}

@keyframes fade-up {
    from {
        transform: translateY(8px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>
