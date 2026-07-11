import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { useVoteStore } from '../vote';

describe('vote store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('deduplicates voters for repeated same-user vote events', () => {
        const voteStore = useVoteStore();
        voteStore.resetVote();

        voteStore.addVote(2, 42, false);
        voteStore.addVote(2, 42, false);
        voteStore.addVote(2, 42, false);

        const voters = [...(voteStore.voted?.up.voters ?? [])];
        assert.deepEqual(voters, [42]);
    });

    it('resetVote is idempotent and returns empty vote state', () => {
        const voteStore = useVoteStore();
        voteStore.resetVote();
        voteStore.addVote(1, 7, true);

        voteStore.resetVote();
        voteStore.resetVote();

        const snapshot = {
            down: {
                voters: [...(voteStore.voted?.down.voters ?? [])],
                voted: voteStore.voted?.down.voted ?? false,
            },
            up: {
                voters: [...(voteStore.voted?.up.voters ?? [])],
                voted: voteStore.voted?.up.voted ?? false,
            },
            imposter: {
                voters: [...(voteStore.voted?.imposter.voters ?? [])],
                voted: voteStore.voted?.imposter.voted ?? false,
            },
        };

        assert.deepEqual(snapshot, {
            down: { voters: [], voted: false },
            up: { voters: [], voted: false },
            imposter: { voters: [], voted: false },
        });
    });
});
