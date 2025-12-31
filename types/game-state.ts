export interface GameStateEmits {
    (e: 'nextGame' | 'skipWait'): void;
    (e: 'voteForPlayer', playerId: number): void;
    (e: 'guessWord', word: string): void;
}
