import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bindGameLifecycle } from '../game-lifecycle';

class FakeSocket {
    private socketListeners = new Map<string, Array<() => void>>();

    private ioListeners = new Map<string, Array<() => void>>();

    io = {
        on: (event: string, handler: () => void) => {
            const list = this.ioListeners.get(event) ?? [];
            list.push(handler);
            this.ioListeners.set(event, list);
        },
    };

    on(event: string, handler: () => void) {
        const list = this.socketListeners.get(event) ?? [];
        list.push(handler);
        this.socketListeners.set(event, list);
    }

    emitSocket(event: string) {
        const list = this.socketListeners.get(event) ?? [];
        list.forEach(handler => handler());
    }

    emitIo(event: string) {
        const list = this.ioListeners.get(event) ?? [];
        list.forEach(handler => handler());
    }
}

describe('bindGameLifecycle', () => {
    it('triggers vote reset on reconnect attempt', () => {
        const socket = new FakeSocket();
        let resetCount = 0;

        bindGameLifecycle(socket, {
            onScheduleSync: () => {
                // no-op
            },
            onResetVote: () => {
                resetCount += 1;
            },
            onClearClue: () => {
                // no-op
            },
        });

        socket.emitIo('reconnect_attempt');

        assert.equal(resetCount, 1);
    });

    it('triggers sync schedule on reconnect', () => {
        const socket = new FakeSocket();
        let syncCount = 0;

        bindGameLifecycle(socket, {
            onScheduleSync: () => {
                syncCount += 1;
            },
            onResetVote: () => {
                // no-op
            },
            onClearClue: () => {
                // no-op
            },
        });

        socket.emitIo('reconnect');

        assert.equal(syncCount, 1);
    });

    it('resets vote and clears clue on disconnect', () => {
        const socket = new FakeSocket();
        let resetCount = 0;
        let clearCount = 0;

        bindGameLifecycle(socket, {
            onScheduleSync: () => {
                // no-op
            },
            onResetVote: () => {
                resetCount += 1;
            },
            onClearClue: () => {
                clearCount += 1;
            },
        });

        socket.emitSocket('disconnect');

        assert.equal(resetCount, 1);
        assert.equal(clearCount, 1);
    });
});
