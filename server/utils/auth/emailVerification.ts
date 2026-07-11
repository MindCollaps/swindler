import { randomBytes } from 'node:crypto';
import { getRedisSync, setRedisSync, unsetRedisSync } from '../backend/redis';

const EMAIL_VERIFY_PREFIX = 'auth:email-verify:';
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function createEmailVerificationToken(userId: number) {
    const token = randomBytes(32).toString('hex');
    const key = `${ EMAIL_VERIFY_PREFIX }${ token }`;

    await setRedisSync(key, userId.toString(), EMAIL_VERIFY_TTL_MS);

    return token;
}

export async function consumeEmailVerificationToken(token: string) {
    const key = `${ EMAIL_VERIFY_PREFIX }${ token }`;
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

export const emailVerificationTokenTtlHours = 24;
