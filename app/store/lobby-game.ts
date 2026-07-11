import type { Lobby } from '~~/types/redis';
import { defineStore } from 'pinia';

export const useLobbyGameStore = defineStore('lobby-game', {
    state: () => ({
        lobby: null as Lobby | null,
        connected: false,
        spectator: false,
        lobbyNotFound: false,
        connectionError: false,
    }),
    actions: {
        setLobby(lobby: Lobby | null) {
            this.lobby = lobby;
        },
        setConnected(connected: boolean) {
            this.connected = connected;
        },
        setSpectator(spectator: boolean) {
            this.spectator = spectator;
        },
        setLobbyNotFound(notFound: boolean) {
            this.lobbyNotFound = notFound;
        },
        setConnectionError(hasError: boolean) {
            this.connectionError = hasError;
        },
        resetConnectionFlags() {
            this.connected = false;
            this.lobbyNotFound = false;
            this.connectionError = false;
        },
        reset() {
            this.lobby = null;
            this.connected = false;
            this.spectator = false;
            this.lobbyNotFound = false;
            this.connectionError = false;
        },
    },
});
