import type { GameRules, Lobby } from './backend/db';

export interface GameData {
    round: number;
    yourTurn: boolean;
    turn: string;
    word?: string;
    impostor: boolean;
}

export interface LobbyData extends Omit<Lobby, | 'gameEvents' | 'players' | 'founder' | 'gameRules' | 'game' | 'wordLists'> {
    gameRules?: GameRuleData;
    founder: string;
    players: UserData[];
}

export interface GameRuleData extends GameRules {
    editable: boolean;
}

export interface UserData {
    username: string;
}
