export const GAME_SYNC_MIN_INTERVAL_MS = 300;

export interface RehydrateSchedulerOptions {
    emitSync: () => void;
    minIntervalMs?: number;
    now?: () => number;
    setTimeoutFn?: (cb: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
    clearTimeoutFn?: (handle: ReturnType<typeof setTimeout>) => void;
}

export interface RehydrateScheduler {
    schedule: () => void;
    dispose: () => void;
}

export function createRehydrateScheduler(options: RehydrateSchedulerOptions): RehydrateScheduler {
    const minIntervalMs = options.minIntervalMs ?? GAME_SYNC_MIN_INTERVAL_MS;
    const now = options.now ?? (() => Date.now());
    const setTimeoutFn = options.setTimeoutFn ?? ((cb, delayMs) => setTimeout(cb, delayMs));
    const clearTimeoutFn = options.clearTimeoutFn ?? (handle => clearTimeout(handle));

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSyncAt = -minIntervalMs;

    const schedule = () => {
        const current = now();
        const elapsed = current - lastSyncAt;

        if (elapsed >= minIntervalMs) {
            options.emitSync();
            lastSyncAt = current;
            return;
        }

        if (timer) return;

        timer = setTimeoutFn(() => {
            timer = null;
            options.emitSync();
            lastSyncAt = now();
        }, minIntervalMs - elapsed);
    };

    const dispose = () => {
        if (timer) {
            clearTimeoutFn(timer);
            timer = null;
        }
    };

    return {
        schedule,
        dispose,
    };
}
