import type { Lobby } from "~/types/backend/db";
import type { AsCreateDatabaseObject } from "~/types/backend/request";
import { devGameRules } from "~/types/dev";
import type { LobbyData } from "~/types/game";

export function convertLobby(lobby: AsCreateDatabaseObject<Lobby>): LobbyData {
      return {
        founded: lobby.founded,
        founder: "Test",
        gameRules: devGameRules,
        gameStarted: lobby.gameStarted,
        public: lobby.public,
        round: lobby.round,
        token: lobby.token,
        wordLists: [{id: 0, public: true, shared: false, stars: [], system: true, words: [{id: 0, isCustom: false, word: 'Bär'}]}],

    }
}