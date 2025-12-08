export interface Lobby {
    players: ReidsLobbyPlayer[];
    founder: ReidsLobbyPlayer;
    founded: Date;
    token: string;
    public: boolean;
    gameStarted: boolean;
    gameRunning: boolean;
    game?: Game;
    gameNumber: number;
    round: number;
    gameRules: GameRules;
    wordLists: number[];
    gameEvents: GameEvent[];
    playedGames: PlayedGame[];
}

export interface ReidsLobbyPlayer {
    id: number;
    username: string;
    ready: boolean;
    fakeUser: boolean;
}

export interface FakeUser {
    id: number;
    nickname: string;
    lobby: string;
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
    gameState: GameState;
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

export interface PlayedGame extends Omit<Game, 'round' | 'turn'> {
    roundsPlayed: number;
}

export interface GameEvent {
    initiatorId: number;
    receiverId?: number;
    triggered: Date;
    type: GameEventType;
    round: number;
    turn: number;
    gameNumber: number;
}

export enum GameEventType {
    VotedCorrectly,
    VotedIncorrectly,
    VotedAbstain,
    SaysImposer,
    ReceivedUpVote,
    ReceivedDownVote,
}

export enum GameState {
    Idle,
    Round,
    Cue,
    RoundEnd,
    GameEnd,
    Vote,
}

export interface Voted {
    down: Vote;
    up: Vote;
    imposter: Vote;
}

export interface Vote {
    voted: boolean;
    num: number;
}
