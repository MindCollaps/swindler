import { randomBytes } from 'crypto';

export function createToken(length = 8, complex = true): string {
    if (!Number.isSafeInteger(length) || length <= 0) {
        throw new RangeError('Token length must be a positive safe integer.');
    }

    if (length > 4096) {
        throw new RangeError('Token length must be 4096 characters or fewer.');
    }

    const chars = complex
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
        : 'abcdefghijklmnopqrstuvwxyz0123456789';

    if (chars.length === 0) {
        throw new Error('Character set cannot be empty.');
    }

    const maxByte = 256 - (256 % chars.length);
    let token = '';

    // Use rejection sampling to avoid modulo bias in character selection.
    while (token.length < length) {
        const bytes = randomBytes(length - token.length);
        for (const byte of bytes) {
            if (byte < maxByte) {
                token += chars[byte % chars.length];
                if (token.length === length) {
                    break;
                }
            }
        }
    }

    return token;
}
