import type { GivingClue, LobbyGame, GameResults, GameState } from '~~/types/redis';
import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
    state: () => ({
        game: null as LobbyGame | null,
        clue: null as GivingClue | null,
        gameResults: null as GameResults | null,
        hasVotedForPlayer: false,
    }),
    actions: {
        setGame(game: LobbyGame | null) {
            this.game = game;
        },
        patchGame(partial: Partial<LobbyGame>) {
            if (!this.game) return;
            Object.assign(this.game, partial);
        },
        setGameState(state: GameState) {
            if (!this.game) return;
            this.game.gameState = state;
        },
        setClue(clue: GivingClue | null) {
            this.clue = clue;
        },
        setGameResults(results: GameResults | null) {
            this.gameResults = results;
        },
        setHasVotedForPlayer(voted: boolean) {
            this.hasVotedForPlayer = voted;
        },
        resetRoundState() {
            this.clue = null;
            this.hasVotedForPlayer = false;
        },
        resetGameSession() {
            this.game = null;
            this.clue = null;
            this.gameResults = null;
            this.hasVotedForPlayer = false;
        },
    },
});
