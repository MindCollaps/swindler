import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldApplyGamePatch } from '../game-update-order';

describe('shouldApplyGamePatch', () => {
    it('accepts patch when there is no current state', () => {
        const accepted = shouldApplyGamePatch(null, { stateVersion: 1 });
        assert.equal(accepted, true);
    });

    it('rejects stale versioned patch', () => {
        const accepted = shouldApplyGamePatch({
            round: 1,
            turn: 1,
            imposter: false,
            gameState: 1,
            turnOrder: [1, 2],
            stateVersion: 5,
        }, {
            stateVersion: 4,
        });

        assert.equal(accepted, false);
    });

    it('accepts newer versioned patch', () => {
        const accepted = shouldApplyGamePatch({
            round: 1,
            turn: 1,
            imposter: false,
            gameState: 1,
            turnOrder: [1, 2],
            stateVersion: 5,
        }, {
            stateVersion: 6,
        });

        assert.equal(accepted, true);
    });

    it('rejects stale timestamp patch when versions are absent', () => {
        const accepted = shouldApplyGamePatch({
            round: 1,
            turn: 1,
            imposter: false,
            gameState: 1,
            turnOrder: [1, 2],
            stateTimestamp: 200,
        }, {
            stateTimestamp: 100,
        });

        assert.equal(accepted, false);
    });
});
