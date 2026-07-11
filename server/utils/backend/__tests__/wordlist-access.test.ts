import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canReadWordlist, canEditWordlist, canDeleteWordlist } from '../wordlist-access';

describe('wordlist access policy', () => {
    const owner = { userId: 10, admin: false };
    const otherUser = { userId: 99, admin: false };
    const admin = { userId: 1, admin: true };

    it('allows owner to read private non-default list', () => {
        const decision = canReadWordlist({
            fromUserId: 10,
            default: false,
            public: false,
            shared: false,
            sharedWithUser: false,
        }, owner);

        assert.equal(decision.allowed, true);
    });

    it('allows shared user to read shared list', () => {
        const decision = canReadWordlist({
            fromUserId: 10,
            default: false,
            public: false,
            shared: true,
            sharedWithUser: true,
        }, otherUser);

        assert.equal(decision.allowed, true);
    });

    it('denies non-owner non-admin edit on private list', () => {
        const decision = canEditWordlist({
            fromUserId: 10,
            default: false,
            public: false,
        }, otherUser);

        assert.equal(decision.allowed, false);
        assert.equal(decision.reason, 'forbidden');
    });

    it('requires admin for default list edits', () => {
        const decision = canEditWordlist({
            fromUserId: 10,
            default: true,
            public: true,
        }, owner);

        assert.equal(decision.allowed, false);
        assert.equal(decision.reason, 'default_requires_admin');

        const adminDecision = canEditWordlist({
            fromUserId: 10,
            default: true,
            public: true,
        }, admin);

        assert.equal(adminDecision.allowed, true);
    });

    it('blocks delete when wordlist is in use by active lobby', () => {
        const decision = canDeleteWordlist({
            fromUserId: 10,
            default: false,
            public: false,
        }, owner, true);

        assert.equal(decision.allowed, false);
        assert.equal(decision.reason, 'in_use');
    });
});
