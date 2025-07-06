import type { GameRules, Lobby, WordList } from './backend/db';

export interface GameData {
    round: number;
    yourTurn: boolean;
    turn: string;
    word?: string;
    impostor: boolean;
}

export interface LobbyData extends Omit<Lobby, 'id' | 'gameEvents' | 'players' | 'founder' | 'gameRules' | 'game' | 'wordLists'> {
    gameRules?: GameRuleData;
    founder: string;
    wordLists: WordList[];
}

export interface GameRuleData extends Omit<GameRules, 'id'> {
    editable: boolean;
}
