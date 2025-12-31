import IORedis from 'ioredis';

export function getRedis() {
    return new IORedis({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: 6379,
        family: 4,
        db: 0,
        maxRetriesPerRequest: null,
        autoResubscribe: true,
    });
}

export const redisClient = getRedis();

export function getRedisSync(key: string) {
    return new Promise<string | null | undefined>((resolve, reject) => redisClient.get(key, (err, result) => {
        if (err) return reject(err);
        resolve(result);
    }));
}

export type RedisDataGet<T extends Record<string, any> | any[], D extends T | null = null> = () => Promise<T | D>;

// export interface RedisData {
// }

// export async function getRedisData<K extends keyof RedisData, D extends RedisData[K], T = RedisData[K]>(key: K, defaults: D): Promise<T | D>;
// export async function getRedisData<K extends keyof RedisData>(key: K): Promise<RedisData[K] | null>;
// export async function getRedisData<K extends keyof RedisData, D extends RedisData[K] | undefined = RedisData[K] | undefined>(key: K, defaults?: D): Promise<RedisData[K] | null> {
//     const data = await getRedisSync(key);
//     if (typeof data === 'string') return JSON.parse(data) as RedisData[K];
//     return defaults || data || null;
// }

// export async function setRedisData<K extends keyof RedisData>(key: K, data: RedisData[K], expireIn: number) {
//     await setRedisSync(key, JSON.stringify(data), expireIn);
//     await defaultRedis.publish('update', key);
// }

export function setRedisSync(key: string, data: string, expireIn: number) {
    return new Promise<void>((resolve, reject) => redisClient.set(key, data, 'PX', expireIn, (err, result) => {
        if (err) return reject(err);
        if (result !== 'OK') return reject(new Error(`Failed to set key: ${key}`));
        resolve();
    }));
}

export function expireRedisSync(key: string, expireIn: number) {
    return new Promise<void>((resolve, reject) => redisClient.pexpire(key, expireIn, (err, result) => {
        if (err) return reject(err);
        if (result === 1) {
            resolve();
        } else {
            reject(new Error(`Failed to set expiration on key: ${key} (key may not exist)`));
        }
    }));
}

export function unsetRedisSync(key: string) {
    return new Promise<void>((resolve, reject) => redisClient.del(key, (err, result) => {
        if (err) return reject(err);
        // result is the number of keys deleted, but we don't reject if key doesn't exist
        resolve();
    }));
}
