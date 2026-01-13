export interface GameStateEmits {
    (e: 'nextGame' | 'skipWait' | 'returnToLobby'): void;
    (e: 'voteForPlayer', playerId: number): void;
    (e: 'guessWord', word: string): void;
}

