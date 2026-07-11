import type { LobbyGame } from '~~/types/redis';

export function shouldApplyGamePatch(current: LobbyGame | null, incoming: Partial<LobbyGame>): boolean {
    if (!current) return true;

    const incomingVersion = incoming.stateVersion;
    const currentVersion = current.stateVersion;
    if (typeof incomingVersion === 'number' && typeof currentVersion === 'number') {
        return incomingVersion >= currentVersion;
    }

    const incomingTimestamp = incoming.stateTimestamp;
    const currentTimestamp = current.stateTimestamp;
    if (typeof incomingTimestamp === 'number' && typeof currentTimestamp === 'number') {
        return incomingTimestamp >= currentTimestamp;
    }

    return true;
}
