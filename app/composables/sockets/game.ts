import type { Socket } from 'socket.io-client';
import { GameState } from '~~/types/redis';
import type { GivingClue, LobbyGame, Voted, Lobby } from '~~/types/redis';
import { useLobbySocket } from './lobby';
import { useStore } from '~/store';

let gameSocket: Socket | undefined;
const game: Ref<LobbyGame | null> = ref(null);
const voted: Ref<Voted | null> = ref(null);
const clue: Ref<GivingClue | null> = ref(null);
let gameSetup = false;
const myTurn: ComputedRef<boolean> = computed(() => {
    const store = useStore();
    if (!store.me?.userid || !game.value?.turn) {
        return false;
    }

    return store.me.userid == game.value.turn;
});

// From Lobby
let lobby: Ref<Lobby | null> = ref(null);
let connected: Ref<boolean> = ref(false);
let disconnect = () => { };

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
        if (!gameSocket) return;
        gameSocket.emit('vote', vote);
    }
};

export function useGameSocket(lobbyId: string, options: { onHeart?: () => void } = {}) {
    if (!gameSocket) {
        const { lobbySocket, lobby: lobbyLobby, connected: lobbyConnected, disconnect: lobbyDisconnect } = useLobbySocket(lobbyId);
        gameSocket = lobbySocket;
        connected = lobbyConnected;
        lobby = lobbyLobby;
        disconnect = lobbyDisconnect;
    }

    const connect = () => {
        if (!gameSocket) return;

        if (options.onHeart) {
            gameSocket.on('vote', value => {
                if (value as number == 4) {
                    if (options.onHeart) {
                        options.onHeart();
                    }
                }
            });
        }

        if (gameSetup) return;
        gameSetup = true;

        gameSocket.on('game', value => {
            game.value = value;
        });
        gameSocket.on('vote', value => {
            if (value as number != 4) {
                addVote(value);
            }
        });
        gameSocket.on('voted', value => {
            voted.value = value;
        });
        gameSocket.on('roundEnd', () => {
            if (!game.value) return;
            if (!gameSocket) return;
            resetVote();
        });
        gameSocket.on('gameEnd', () => {
            if (!game.value) return;
            game.value.gameState = GameState.GameEnd;
        });
        gameSocket.on('givingClue', value => {
            if (!game.value) return;
            clue.value = value;
            game.value.gameState = GameState.Cue;
        });
        gameSocket.on('voting', () => {
            if (!game.value) return;
            game.value.gameState = GameState.Vote;
        });
        gameSocket.on('continue', () => {
            if (!gameSocket) return;
            gameSocket.emit('game');
            resetVote();
        });
    };

    onMounted(connect);

    return { gameSocket, lobby, game, voted, addVote, myTurn, disconnect, connected, clue };
}

function resetVote() {
    voted.value = {
        down: { num: 0, voted: false },
        up: { num: 0, voted: false },
        imposter: { num: 0, voted: false },
    };
}

