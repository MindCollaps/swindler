import type { LobbyGame } from '~~/types/redis';
import { useLobbySocket } from './lobby';

const game: Ref<LobbyGame | null> = ref(null);
const voted: Ref<Voted | null> = ref(null);

export interface Voted {
    down: number;
    up: number;
    imposter: number;
}

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
    };

    onMounted(connect);

    return { gameSocket, lobby, game, voted, disconnect, connected };
}

function resetVote() {
    voted.value = {
        down: 0,
        up: 0,
        imposter: 0,
    };
}

function addVote(vote: number) {
    if (!voted.value) {
        resetVote();
    }

    if (!voted.value) return;

    switch (vote as number) {
        case 1:
            voted.value.down += 1;
            break;
        case 2:
            voted.value.up += 1;
            break;
        case 3:
            voted.value.imposter = +1;
            break;
    }
}
