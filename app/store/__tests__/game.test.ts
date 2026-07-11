import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { GameState } from '~~/types/redis';
import { useGameStore } from '../game';

describe('game store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('patches existing game state and ignores patches without game', () => {
        const gameStore = useGameStore();

        gameStore.patchGame({ gameState: GameState.Cue });
        assert.equal(gameStore.game, null);

        gameStore.setGame({
            round: 1,
            turn: 2,
            imposter: false,
            turnOrder: [2, 3, 4],
            gameState: GameState.Round,
        });

        gameStore.patchGame({
            gameState: GameState.Cue,
            stateVersion: 5,
        });

        const patchedGame = gameStore.game as { gameState?: GameState; stateVersion?: number } | null;
        assert.equal(patchedGame?.gameState, GameState.Cue);
        assert.equal(patchedGame?.stateVersion, 5);
    });

    it('resets transient round state and full game session state', () => {
        const gameStore = useGameStore();

        gameStore.setGame({
            round: 1,
            turn: 2,
            imposter: false,
            turnOrder: [2, 3, 4],
            gameState: GameState.Round,
        });
        gameStore.setClue({
            clue: 'test',
            player: {
                id: 2,
                username: 'player',
                ready: true,
                fakeUser: false,
                connected: true,
            },
        });
        gameStore.setHasVotedForPlayer(true);
        gameStore.setGameResults({
            wasCorrect: true,
            votes: [],
        });

        gameStore.resetRoundState();
        assert.equal(gameStore.clue, null);
        assert.equal(gameStore.hasVotedForPlayer, false);
        assert.ok(gameStore.game);

        gameStore.resetGameSession();
        assert.equal(gameStore.game, null);
        assert.equal(gameStore.clue, null);
        assert.equal(gameStore.gameResults, null);
        assert.equal(gameStore.hasVotedForPlayer, false);
    });
});
