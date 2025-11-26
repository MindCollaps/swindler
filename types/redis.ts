export interface Lobby {
    players: ReidsLobbyPlayer[];
    founder: ReidsLobbyPlayer;
    founded: Date;
    token: string;
    public: boolean;
    gameStarted: boolean;
    game?: Game;
    round: number;
    gameRules: GameRules;
}

export interface ReidsLobbyPlayer {
    id: number;
    username: string;
}

export interface GameRules {
    maxRounds: number;
    rounds: number;
    maxPlayers: number;
    timeLimited: boolean;
    timeLimit: number
    allowSpecialGameMode: boolean;
    membersCanAddWordLists: boolean;
    membersCanAddCustomWordLists: boolean;
}

export interface Game {
    round: number;
    turn: number;
    wordId: number;
    imposter: number;
    specialGameMode: number;
}

// enum GameEventType {
//   VotedCorrectly
//   VotedIncorrectly
//   VotedAbstain
//   ReceivedUpVote
//   ReceivedDownVote
// }

// model GameEvent {
//   id          Int           @id @default(autoincrement())
//   initiatorId Int
//   receiverId  Int?
//   triggered   DateTime      @default(now())
//   type        GameEventType
//   lobbyId     Int

//   initiator User  @relation("GameEventInitiator", fields: [initiatorId], references: [id])
//   receiver  User? @relation("GameEventReceiver", fields: [receiverId], references: [id])
// }