import type { Lobby, LobbyStat, RedisLobbyPlayer, GameEvent } from '../../../types/redis';
import { GameEventType } from '../../../types/redis';

export function calculateLobbyStats(lobby: Lobby): LobbyStat[] {
    const events = lobby.gameEvents;
    const players = lobby.players;

    const stats: LobbyStat[] = [];

    const addStat = (title: string, className: string, unit: string, type: GameEventType, field: 'initiatorId' | 'receiverId') => {
        const winner = getStatWinner(events, type, field, players);
        if (winner.player && winner.count > 0) {
            stats.push({
                title,
                class: className,
                unit,
                player: winner.player,
                count: winner.count,
                message: winner.message,
            });
        }
    };

    addStat('Best Detective', 'success', 'correct votes', GameEventType.VotedCorrectly, 'initiatorId');
    addStat('Worst Detective', 'error', 'incorrect votes', GameEventType.VotedIncorrectly, 'initiatorId');
    addStat('Most Loved', 'primary', 'hearts', GameEventType.ReceivedUpVote, 'receiverId');
    addStat('Most Sus', 'warning', 'votes', GameEventType.ReceivedDownVote, 'receiverId');
    addStat('Most Paranoid', 'info', 'calls', GameEventType.SaysImposter, 'initiatorId');

    return stats.slice(0, 3);
}

export function getStatWinner(events: GameEvent[], type: GameEventType, field: 'initiatorId' | 'receiverId', players: RedisLobbyPlayer[]) {
    const counts = new Map<number, number>();
    events.filter(e => e.type === type).forEach(e => {
        const id = e[field];
        if (id !== undefined) {
            counts.set(id, (counts.get(id) || 0) + 1);
        }
    });

    let max = -1;
    let winnerId = -1;
    counts.forEach((count, id) => {
        if (count > max) {
            max = count;
            winnerId = id;
        }
    });

    if (max <= 0) {
        return { count: 0, message: 'No one yet' };
    }

    const player = players.find(p => p.id === winnerId);
    return { player, count: max, message: '' };
}
