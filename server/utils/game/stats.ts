import type { Lobby, LobbyStat, RedisLobbyPlayer, GameEvent, PlayedGame, WordSaid } from '../../../types/redis';
import { GameEventType, WinReason } from '../../../types/redis';

export function calculateLobbyStats(lobby: Lobby): LobbyStat[] {
    const events = lobby.gameEvents;
    const players = lobby.players;
    const games = lobby.playedGames;
    const wordsSaid = lobby.wordsSaid;

    const stats: LobbyStat[] = [];

    const addStat = (title: string, className: string, unit: string, counts: Map<number, number>) => {
        const winner = getWinner(counts, players);
        if (winner.player && winner.count > 0) {
            stats.push({
                title,
                class: className,
                unit,
                player: winner.player,
                count: winner.count,
            });
        }
    };

    addStat('Best Detective', 'success', 'correct votes', countEvents(events, GameEventType.VotedCorrectly, 'initiatorId'));
    addStat('Worst Detective', 'error', 'incorrect votes', countEvents(events, GameEventType.VotedIncorrectly, 'initiatorId'));
    addStat('Best Swindler', 'primary', 'successful cons', countSwindles(games));
    addStat('Most Wins', 'success', 'games won', countWins(games));
    addStat('Most Loved', 'primary', 'hearts', countEvents(events, GameEventType.ReceivedUpVote, 'receiverId'));
    addStat('Most Sus', 'warning', 'votes', countEvents(events, GameEventType.ReceivedDownVote, 'receiverId'));
    addStat('Most Paranoid', 'info', 'calls', countEvents(events, GameEventType.SaysImposter, 'initiatorId'));
    addStat('Wordsmith', 'warning', 'clues given', countWords(wordsSaid));

    return stats;
}

export function getWinner(counts: Map<number, number>, players: RedisLobbyPlayer[]) {
    let max = 0;
    let winnerId = -1;

    counts.forEach((count, id) => {
        if (count > max) {
            max = count;
            winnerId = id;
        }
    });

    if (max <= 0) {
        return { count: 0 };
    }

    const player = players.find(p => p.id === winnerId);
    return { player, count: max };
}

function countEvents(events: GameEvent[], type: GameEventType, field: 'initiatorId' | 'receiverId'): Map<number, number> {
    const counts = new Map<number, number>();

    events.filter(e => e.type === type).forEach(e => {
        const id = e[field];
        if (id !== undefined) {
            counts.set(id, (counts.get(id) || 0) + 1);
        }
    });

    return counts;
}

function countWords(wordsSaid: WordSaid[]): Map<number, number> {
    const counts = new Map<number, number>();

    wordsSaid.forEach(w => {
        counts.set(w.playerId, (counts.get(w.playerId) || 0) + 1);
    });

    return counts;
}

// A game's winReason/wasCorrect pair encodes opposite things depending on how it ended:
// Voted   -> wasCorrect means the crew correctly voted out the imposter (crew wins).
// Guessed -> wasCorrect means the imposter correctly guessed the word (imposter wins).
// Returns null for a game whose outcome can't be determined, so callers can skip it
// instead of silently crediting the wrong side.
function imposterWon(game: PlayedGame): boolean | null {
    if (game.winReason === undefined || !game.gameResults) return null;
    if (game.winReason === WinReason.Guessed) return game.gameResults.wasCorrect;
    return !game.gameResults.wasCorrect;
}

function countSwindles(games: PlayedGame[]): Map<number, number> {
    const counts = new Map<number, number>();

    games.filter(g => imposterWon(g) === true).forEach(g => {
        counts.set(g.imposter, (counts.get(g.imposter) || 0) + 1);
    });

    return counts;
}

function countWins(games: PlayedGame[]): Map<number, number> {
    const counts = new Map<number, number>();

    games.forEach(g => {
        const outcome = imposterWon(g);
        if (outcome === null) return;

        if (outcome) {
            counts.set(g.imposter, (counts.get(g.imposter) || 0) + 1);
        }
        else {
            g.turnOrder.filter(id => id !== g.imposter).forEach(id => {
                counts.set(id, (counts.get(id) || 0) + 1);
            });
        }
    });

    return counts;
}
