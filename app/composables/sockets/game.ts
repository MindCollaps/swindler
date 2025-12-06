import type { LobbyGame, Voted } from '~~/types/redis';
import { useLobbySocket } from './lobby';

const game: Ref<LobbyGame | null> = ref(null);
const voted: Ref<Voted | null> = ref(null);

export function useGameSocket(lobbyId: string, options: { onHeart?: () => void } = {}) {
    const { lobbySocket: gameSocket, lobby, connected, disconnect } = useLobbySocket(lobbyId);

    const connect = () => {
        gameSocket.on('game', value => {
            game.value = value;
        });
        gameSocket.on('vote', value => {
            if (value as number == 4) {
                if (options.onHeart) {
                    options.onHeart();
                }
            }
            else {
                addVote(value);
            }
        });
        gameSocket.on('voted', value => {
            voted.value = value;
        });
        gameSocket.on('roundEnd', () => {
            resetVote();
        });
    };

    onMounted(connect);

    const addVote = (vote: number, selfVoted: boolean = false) => {
        if (!voted.value) {
            resetVote();
        }

        if (!voted.value) return;

        switch (vote as number) {
            case 1:
                voted.value.down.num += 1;
                if (selfVoted) {
                    voted.value.down.voted = selfVoted;
                }
                break;
            case 2:
                voted.value.up.num += 1;
                if (selfVoted) {
                    voted.value.up.voted = selfVoted;
                }
                break;
            case 3:
                voted.value.imposter.num += 1;
                if (selfVoted) {
                    voted.value.imposter.voted = selfVoted;
                }
                break;
        }

        if (selfVoted) {
            gameSocket.emit('vote', vote);
        }
    };

    return { gameSocket, lobby, game, voted, addVote, disconnect, connected };
}

function resetVote() {
    voted.value = {
        down: { num: 0, voted: false },
        up: { num: 0, voted: false },
        imposter: { num: 0, voted: false },
    };
}

