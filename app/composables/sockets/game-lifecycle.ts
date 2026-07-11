export interface LifecycleSocket {
    on: (...args: any[]) => unknown;
    io: {
        on: (...args: any[]) => unknown;
    };
}

export interface GameLifecycleBindings {
    onScheduleSync: () => void;
    onResetVote: () => void;
    onClearClue: () => void;
}

export function bindGameLifecycle(socket: LifecycleSocket, handlers: GameLifecycleBindings) {
    socket.on('connect', handlers.onScheduleSync);

    socket.io.on('reconnect_attempt', handlers.onResetVote);

    socket.io.on('reconnect', handlers.onScheduleSync);

    socket.on('disconnect', () => {
        handlers.onResetVote();
        handlers.onClearClue();
    });
}
