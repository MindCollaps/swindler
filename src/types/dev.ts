import type { GameData, GameRuleData, LobbyData } from './game';

export const devGameRules: GameRuleData = { allowSpecialGameMode: false, lobby: 0, maxPlayers: 4, maxRounds: 4, membersCanAddCustomWordLists: true, membersCanAddWordLists: true, rounds: 4, timeLimit: 0, timeLimited: false, editable: false };

export const devLobby: LobbyData = { token: 'kldjalks', founded: new Date(), founder: 'Noah', gameRules: devGameRules, gameStarted: true, public: false, round: 1, wordLists: [] };

export const devGameData: GameData = { impostor: false, round: 1, turn: 'Noah', yourTurn: false, word: 'Salatsoße' };
