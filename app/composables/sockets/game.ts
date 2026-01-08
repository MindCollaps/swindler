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

const disconnectGameSocket = () => {
    gameSocket = undefined;
};

// From Lobby
let lobby: Ref<Lobby | null> = ref(null);
let connected: Ref<boolean> = ref(false);
let lobbyNotFound: Ref<boolean> = ref(false);
let disconnect = () => { };

const addVote = (vote: number, selfVoted: boolean = false, voterId?: number) => {
    if (!voted.value) {
        resetVote();
    }

    if (!voted.value) return;
    
    // Helper to safely add voter
    const addVoter = (list: number[], id?: number) => {
        if (id !== undefined && !list.includes(id)) {
            list.push(id);
        }
    };

    switch (vote as number) {
        case 1:
            // voted.value.down.num += 1;
            if (selfVoted) {
                voted.value.down.voted = selfVoted;
            }
            if (voterId) addVoter(voted.value.down.voters, voterId);
            break;
        case 2:
            // voted.value.up.num += 1;
            if (selfVoted) {
                voted.value.up.voted = selfVoted;
            }
            if (voterId) addVoter(voted.value.up.voters, voterId);
            break;
        case 3:
            // voted.value.imposter.num += 1;
            if (selfVoted) {
                voted.value.imposter.voted = selfVoted;
            }
            if (voterId) addVoter(voted.value.imposter.voters, voterId);
            break;
    }

    if (selfVoted) {
        if (!gameSocket) return;
        gameSocket.emit('vote', vote);
        
        // Optimistic update handled by addVote caller or response? 
        // Logic below adds self to voters list immediately
        const store = useStore();
        if (store.me?.userid) {
            // Check if already voted to determine if we are adding or removing
            let alreadyVoted = false;
            switch(vote) {
                case 1: alreadyVoted = voted.value.down.voters.includes(store.me.userid); break;
                case 2: alreadyVoted = voted.value.up.voters.includes(store.me.userid); break;
                case 3: alreadyVoted = voted.value.imposter.voters.includes(store.me.userid); break;
            }

            if (alreadyVoted) {
                removeVote(vote, true, store.me.userid);
                return; // Stop here, we removed it locally
            }

            switch(vote) {
                case 1: addVoter(voted.value.down.voters, store.me.userid); break;
                case 2: addVoter(voted.value.up.voters, store.me.userid); break;
                case 3: addVoter(voted.value.imposter.voters, store.me.userid); break;
            }
        }
    }
};

const removeVote = (vote: number, selfVoted: boolean = false, voterId?: number) => {
    if (!voted.value) return;

    const removeVoter = (list: number[], id?: number) => {
        if (id === undefined) return;
        const index = list.indexOf(id);
        if (index > -1) {
            list.splice(index, 1);
        }
    };

    switch (vote) {
        case 1:
            if (selfVoted) voted.value.down.voted = false;
            removeVoter(voted.value.down.voters, voterId);
            break;
        case 2:
            if (selfVoted) voted.value.up.voted = false;
            removeVoter(voted.value.up.voters, voterId);
            break;
        case 3:
            if (selfVoted) voted.value.imposter.voted = false;
            removeVoter(voted.value.imposter.voters, voterId);
            break;
    }
}

const gameResults = ref<any>(null);
const hasVotedForPlayer = ref(false);

export function useGameSocket(lobbyId: string, options: { onHeart?: () => void } = {}) {
    if (!gameSocket) {
        const { lobbySocket, lobby: lobbyLobby, connected: lobbyConnected, disconnect: lobbyDisconnect, lobbyNotFound: lobbyNotFoundLobby } = useLobbySocket(lobbyId, { onDisconnect: disconnectGameSocket });
        gameSocket = lobbySocket;
        connected = lobbyConnected;
        lobby = lobbyLobby;
        disconnect = lobbyDisconnect;
        lobbyNotFound = lobbyNotFoundLobby;
    }

    const skipWait = () => {
        if (!gameSocket) return;
        gameSocket.emit('skipWait');
    };

    const voteForPlayer = (playerId: number) => {
        if (!gameSocket) return;
        gameSocket.emit('voteForPlayer', playerId); hasVotedForPlayer.value = true;
    };

    const nextGame = () => {
        if (!gameSocket) return;
        gameSocket.emit('nextGame');
    };

    const guessWord = (word: string) => {
        if (!gameSocket) return;
        gameSocket.emit('guessWord', word);
    };

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
        gameSocket.on('gameUpdate', (value: Partial<LobbyGame>) => {
            if (!game.value) return;
            Object.assign(game.value, value);
            console.log('Game update received:', JSON.stringify(value));
        });
        gameSocket.on('gameEnd', value => {
            if (!game.value) return;
            game.value.gameState = GameState.GameEnd;
            if (value) {
                gameResults.value = value;
            }
            if (gameSocket) {
                gameSocket.emit('game');
            }
        });
        gameSocket.on('vote', value => {
            if (typeof value === 'object' && value.vote && value.vote != 4) {
                 addVote(value.vote, false, value.userId);
            }
            else if (typeof value === 'number' && value != 4) {
                // Initial fallback or if logic changes
                addVote(value);
            }
        });
        gameSocket.on('unvote', value => {
            if (typeof value === 'object' && value.vote && value.userId) {
                removeVote(value.vote, false, value.userId);
            }
        });
        gameSocket.on('voted', value => {
            voted.value = value;
        });
        gameSocket.on('roundEnd', () => {
            if (!game.value) return;
            if (!gameSocket) return;
            resetVote();
            game.value.gameState = GameState.RoundEnd;
        });
        gameSocket.on('givingClue', value => {
            if (!game.value) return;
            const cue: GivingClue = value;

            clue.value = cue;
            game.value.gameState = GameState.Cue;
            lobby.value?.wordsSaid.push({
                playerId: cue.player.id,
                word: cue.clue,
                round: game.value.round,
                turn: game.value.turn,
                gameNumber: lobby.value.gameNumber,
            });
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
        gameSocket.on('start', () => {
            if (!gameSocket) return;
            gameSocket.emit('game');
            resetVote();
            gameResults.value = null;
            hasVotedForPlayer.value = false;
        });
        gameSocket.on('lobbyEnd', () => {
            if (!game.value) return;
            game.value.gameState = GameState.LobbyEnd;
        });
    };

    onMounted(connect);

    return { gameSocket, lobby, game, voted, addVote, myTurn, disconnect, connected, clue, skipWait, voteForPlayer, gameResults, nextGame, hasVotedForPlayer, guessWord, lobbyNotFound };
}

function resetVote() {
    voted.value = {
        down: { voters: [], voted: false },
        up: { voters: [], voted: false },
        imposter: { voters: [], voted: false },
    };
}

