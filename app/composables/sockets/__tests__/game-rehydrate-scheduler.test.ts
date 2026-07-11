import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRehydrateScheduler } from '../game-rehydrate-scheduler';

class FakeClock {
    public now = 0;

    private nextId = 1;

    private tasks: Array<{ id: number; runAt: number; cb: () => void }> = [];

    setTimeout = (cb: () => void, delayMs: number): ReturnType<typeof setTimeout> => {
        const id = this.nextId++;
        this.tasks.push({ id, runAt: this.now + delayMs, cb });
        this.tasks.sort((a, b) => a.runAt - b.runAt);
        return id as unknown as ReturnType<typeof setTimeout>;
    };

    clearTimeout = (handle: ReturnType<typeof setTimeout>) => {
        const id = Number(handle);
        this.tasks = this.tasks.filter(task => task.id !== id);
    };

    advance(ms: number) {
        const target = this.now + ms;

        while (true) {
            const next = this.tasks[0];
            if (!next || next.runAt > target) break;

            this.now = next.runAt;
            this.tasks.shift();
            next.cb();
        }

        this.now = target;
    }
}

describe('createRehydrateScheduler', () => {
    it('syncs immediately on first schedule call', () => {
        const clock = new FakeClock();
        let syncCount = 0;
        const scheduler = createRehydrateScheduler({
            emitSync: () => {
                syncCount += 1;
            },
            minIntervalMs: 300,
            now: () => clock.now,
            setTimeoutFn: clock.setTimeout,
            clearTimeoutFn: clock.clearTimeout,
        });

        scheduler.schedule();

        assert.equal(syncCount, 1);
    });

    it('coalesces burst schedules into one delayed sync', () => {
        const clock = new FakeClock();
        let syncCount = 0;
        const scheduler = createRehydrateScheduler({
            emitSync: () => {
                syncCount += 1;
            },
            minIntervalMs: 300,
            now: () => clock.now,
            setTimeoutFn: clock.setTimeout,
            clearTimeoutFn: clock.clearTimeout,
        });

        scheduler.schedule();
        assert.equal(syncCount, 1);

        clock.advance(100);
        scheduler.schedule();

        clock.advance(50);
        scheduler.schedule();

        assert.equal(syncCount, 1);

        clock.advance(149);
        assert.equal(syncCount, 1);

        clock.advance(1);
        assert.equal(syncCount, 2);
    });

    it('dispose clears pending delayed sync', () => {
        const clock = new FakeClock();
        let syncCount = 0;
        const scheduler = createRehydrateScheduler({
            emitSync: () => {
                syncCount += 1;
            },
            minIntervalMs: 300,
            now: () => clock.now,
            setTimeoutFn: clock.setTimeout,
            clearTimeoutFn: clock.clearTimeout,
        });

        scheduler.schedule();
        assert.equal(syncCount, 1);

        clock.advance(100);
        scheduler.schedule();
        scheduler.dispose();

        clock.advance(1000);
        assert.equal(syncCount, 1);
    });
});
