import type { Game, Lobby, RedisLobbyPlayer } from '../../../types/redis';
import { GameEventType } from '../../../types/redis';

export function chooseImposter(players: RedisLobbyPlayer[]): number {
    if (players.length === 0) throw new Error('players cant be 0');

    // Create a Uint32Array of length 1 for the random index
    const randomIndexArray = new Uint32Array(1);
    crypto.getRandomValues(randomIndexArray);
    const randomIndex = randomIndexArray[0]! % players.length;

    return players[randomIndex]!.id;
}

export function makeTurnOrder(players: RedisLobbyPlayer[]): number[] {
    const ids = players.map(p => p.id);

    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
        const array = new Uint32Array(1);

        crypto.getRandomValues(array);
        const array0 = array[0];
        if (!array0) throw new Error('empty array');
        const j = array0 % (i + 1);

        // Swap ids[i] and ids[j]
        [ids[i]!, ids[j]!] = [ids[j]!, ids[i]!];
    }

    return ids;
}

export function nextPlayer(game: Game, lobby: Lobby): number {
    if (!game.turnOrder || game.turnOrder.length === 0) {
        throw new Error('Game is corrupted');
    }
    const currentIndex = game.turnOrder.indexOf(game.turn);
    if (currentIndex === -1) {
        throw new Error('Game is corrupted');
    }
    // next index, wrap around to 0 if at the end
    const nextIndex = (currentIndex + 1) % game.turnOrder.length;
    const nextPlayer = game.turnOrder[nextIndex];
    if (!nextPlayer) throw new Error('Game is corrupted');
    return nextPlayer;
}

export function isRoundOver(game: Game): boolean {
    if (!game.turnOrder || game.turnOrder.length === 0) {
        throw new Error('Game is corrupted');
    }

    const currentIndex = game.turnOrder.indexOf(game.turn);
    // round over if current turn is last in turn order
    return currentIndex === (game.turnOrder.length - 1);
}

export function isTurn(game: Game, userId: number) {
    return game.turn === userId;
}

export function checkVoteImposter(game: Game, lobby: Lobby): boolean {
    return lobby.gameEvents.filter(x => x.type === GameEventType.SaysImposter &&
        x.turn === game.turn &&
        x.round === game.round &&
        x.gameNumber === lobby.gameNumber).length > lobby.players.length / 2;
}
