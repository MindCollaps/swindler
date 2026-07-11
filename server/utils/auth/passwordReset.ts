import { randomBytes } from 'node:crypto';
import { getRedisSync, setRedisSync, unsetRedisSync } from '../backend/redis';

const PASSWORD_RESET_PREFIX = 'auth:password-reset:';
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

export async function createPasswordResetToken(userId: number) {
    const token = randomBytes(32).toString('hex');
    const key = `${ PASSWORD_RESET_PREFIX }${ token }`;

    await setRedisSync(key, userId.toString(), PASSWORD_RESET_TTL_MS);

    return token;
}

export async function consumePasswordResetToken(token: string) {
    const key = `${ PASSWORD_RESET_PREFIX }${ token }`;
    const rawUserId = await getRedisSync(key);

    if (!rawUserId) {
        return null;
    }

    await unsetRedisSync(key);

    const userId = parseInt(rawUserId, 10);

    if (Number.isNaN(userId)) {
        return null;
    }

    return userId;
}

export const passwordResetTokenTtlMinutes = 15;
