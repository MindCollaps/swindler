import type{ FetchingLobby } from "./fetch";

export interface RedisLobby extends FetchingLobby {
    players: ReidsLobbyPlayer[];
}

export interface ReidsLobbyPlayer {
    id: number;
    username: string;
}