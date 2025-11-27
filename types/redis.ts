export interface Lobby {
    players: ReidsLobbyPlayer[];
    founder: ReidsLobbyPlayer;
    founded: Date;
    token: string;
    public: boolean;
    gameStarted: boolean;
    gameRunning: boolean;
    game?: Game;
    round: number;
    gameRules: GameRules;
    wordLists: number[];
}

export interface ReidsLobbyPlayer {
    id: number;
    username: string;
}

export interface GameRules {
    rounds: number; // rounds in a game, one round = every player made his turn
    games: number; // one word = one round
    maxPlayers: number;
    timeLimited: boolean;
    timeLimit: number;
    allowSpecialGameMode: boolean;
    membersCanAddWordLists: boolean;
    membersCanAddCustomWordLists: boolean;
}

export interface Game {
    round: number;
    turn: number;
    word: LobbyWord;
    imposter: number;
    specialGameMode: number;
    turnOrder: number[];
}

export interface LobbyWord {
    id: number;
    word: string;
}

export interface LobbyWordList {
    id: number;
    name: string;
    description: string;
    words: LobbyWord[];
}

export interface LobbyGame extends Omit<Game, 'imposter' | 'specialGameMode' | 'word' | 'turnOrder'> {
    word?: LobbyWord;
    imposter: boolean;
}

export interface GivingClue {
    clue: string;
    player: ReidsLobbyPlayer;
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
