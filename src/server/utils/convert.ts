import type { Lobby, User } from '~/types/backend/db';
import type { GameRuleData, LobbyData, UserData } from '~/types/game';

export function convertLobby(lobby: Lobby, userId: number): LobbyData {
    let gameRules: GameRuleData | undefined = undefined;

    const players: UserData[] = [];

    for (const p of lobby.players) {
        players.push(convertUser(p));
    }

    if (lobby.gameRules) {
        gameRules = {
            ...lobby.gameRules,
            editable: lobby.founder.id === userId,
        };
    }
    return {
        founder: lobby.founder.username,
        founded: lobby.founded,
        gameStarted: lobby.gameStarted,
        id: lobby.id,
        players: players,
        public: lobby.public,
        round: lobby.round,
        token: lobby.token,
        gameId: lobby.gameId,
        gameRules,
    };
}

export function convertUser(user: User): UserData {
    return {
        username: user.username,
    };
}
