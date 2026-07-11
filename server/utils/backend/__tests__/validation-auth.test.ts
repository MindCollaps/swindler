import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emailVerifySchema, loginSchema, passwordResetSchema, signupSchema } from '../validation';

describe('auth validation schemas', () => {
    it('accepts valid signup payload and normalizes fields', () => {
        const parsed = signupSchema.parse({
            username: 'PlayerOne',
            email: 'PLAYER@EXAMPLE.COM',
            password: 'StrongPass1',
            passwordRepeated: 'StrongPass1',
        });

        assert.equal(parsed.username, 'PlayerOne');
        assert.equal(parsed.email, 'player@example.com');
    });

    it('rejects signup emails with leading/trailing spaces', () => {
        const result = signupSchema.safeParse({
            username: 'PlayerOne',
            email: ' player@example.com ',
            password: 'StrongPass1',
            passwordRepeated: 'StrongPass1',
        });

        assert.equal(result.success, false);
    });

    it('rejects weak signup password', () => {
        const result = signupSchema.safeParse({
            username: 'PlayerOne',
            email: 'player@example.com',
            password: 'weakpass',
            passwordRepeated: 'weakpass',
        });

        assert.equal(result.success, false);
    });

    it('accepts login payload with basic password rules', () => {
        const result = loginSchema.safeParse({
            username: ' PlayerOne ',
            password: 'abc123',
        });

        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.data.username, 'PlayerOne');
        }
    });

    it('accepts and validates password reset payload', () => {
        const ok = passwordResetSchema.safeParse({
            currentPassword: 'OldPass1',
            password: 'NewPass2',
            passwordRepeated: 'NewPass2',
        });
        assert.equal(ok.success, true);

        const mismatchType = passwordResetSchema.safeParse({
            currentPassword: 'OldPass1',
            password: 'short',
            passwordRepeated: 'short',
        });
        assert.equal(mismatchType.success, false);
    });

    it('accepts optional email verify payload and normalizes email', () => {
        const empty = emailVerifySchema.safeParse({});
        assert.equal(empty.success, true);

        const parsed = emailVerifySchema.parse({ email: 'USER@Example.com' });
        assert.equal(parsed.email, 'user@example.com');
    });

    it('rejects email verify payload with padded email', () => {
        const result = emailVerifySchema.safeParse({ email: ' user@example.com ' });
        assert.equal(result.success, false);
    });
});
