import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lobbyPayloadUsesWordList } from '../wordlists';

describe('lobbyPayloadUsesWordList', () => {
    it('returns true when payload contains wordlist id', () => {
        const payload = JSON.stringify({ wordLists: [3, 7, 9] });
        assert.equal(lobbyPayloadUsesWordList(payload, 7), true);
    });

    it('returns false when payload does not contain id', () => {
        const payload = JSON.stringify({ wordLists: [3, 8, 9] });
        assert.equal(lobbyPayloadUsesWordList(payload, 7), false);
    });

    it('returns false for malformed payload', () => {
        assert.equal(lobbyPayloadUsesWordList('{ invalid', 7), false);
    });

    it('returns false when payload is empty', () => {
        assert.equal(lobbyPayloadUsesWordList(null, 7), false);
        assert.equal(lobbyPayloadUsesWordList(undefined, 7), false);
    });
});
