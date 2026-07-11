import type { Socket } from 'socket.io-client';
import { GameState } from '~~/types/redis';
import type { GivingClue, LobbyGame, Voted, Lobby } from '~~/types/redis';
import { storeToRefs } from 'pinia';
import { useLobbySocket } from './lobby';
import { bindGameLifecycle } from './game-lifecycle';
import { createRehydrateScheduler } from './game-rehydrate-scheduler';
import { shouldApplyGamePatch } from './game-update-order';
import { useGameStore } from '~/store/game';
import { useVoteStore } from '~/store/vote';
import { useLobbyGameStore } from '~/store/lobby-game';
import { useStore } from '~/store';

let gameSocket: Socket | undefined;
let listenersBound = false;
let heartListenerBound = false;
let lifecycleBound = false;
let rehydrateScheduler: ReturnType<typeof createRehydrateScheduler> | null = null;

const disconnectGameSocket = () => {
    gameSocket = undefined;
    listenersBound = false;
    heartListenerBound = false;
    lifecycleBound = false;
    rehydrateScheduler?.dispose();
    rehydrateScheduler = null;
};

let retry = () => { };
let disconnect = () => { };

function shouldRouteToLobby(lobby: Lobby | null, currentPath: string, lobbyId: string, currentGameState?: GameState): boolean {
    const knownGameState = currentGameState ?? lobby?.game?.gameState;

    if (knownGameState === undefined) {
        return false;
    }

    return Boolean(
        lobby?.gameStarted &&
        !lobby.gameRunning &&
        knownGameState !== GameState.GameEnd &&
        knownGameState !== GameState.LobbyEnd &&
        currentPath === `/game/${ lobbyId }`,
    );
}

function bindHeartListener(options: { onHeart?: () => void }) {
    if (!gameSocket || !options.onHeart || heartListenerBound) return;

    gameSocket.on('vote', value => {
        const voteValue = typeof value === 'object' && value && 'vote' in value
            ? Number((value as { vote?: number }).vote)
            : Number(value);

        if (voteValue === 4 && options.onHeart) {
            options.onHeart();
        }
    });

    heartListenerBound = true;
}

function initializeGameState() {
    if (!gameSocket) return;
    gameSocket.emit('game');
}

function scheduleGameStateSync() {
    if (!gameSocket) return;
    if (!rehydrateScheduler) {
        rehydrateScheduler = createRehydrateScheduler({
            emitSync: initializeGameState,
        });
    }
    rehydrateScheduler.schedule();
}

function bindSocketLifecycle(
    gameStore: ReturnType<typeof useGameStore>,
    voteStore: ReturnType<typeof useVoteStore>,
) {
    if (!gameSocket || lifecycleBound) return;

    bindGameLifecycle(gameSocket, {
        onScheduleSync: scheduleGameStateSync,
        onResetVote: () => {
            voteStore.resetVote();
        },
        onClearClue: () => {
            gameStore.setClue(null);
        },
    });

    lifecycleBound = true;
}

function cleanupGameSocketState(
    gameStore: ReturnType<typeof useGameStore>,
    voteStore: ReturnType<typeof useVoteStore>,
) {
    rehydrateScheduler?.dispose();
    gameStore.resetGameSession();
    voteStore.resetVote();
}

function subscribeSocketEvents(
    lobbyId: string,
    gameStore: ReturnType<typeof useGameStore>,
    voteStore: ReturnType<typeof useVoteStore>,
    lobbyStore: ReturnType<typeof useLobbyGameStore>,
) {
    if (!gameSocket || listenersBound) return;

    const router = useRouter();
    listenersBound = true;

    gameSocket.on('game', value => {
        const lobbyGame = value as LobbyGame;

        gameStore.setGame(lobbyGame);
        if (shouldRouteToLobby(lobbyStore.lobby, router.currentRoute.value.path, lobbyId, lobbyGame.gameState)) {
            router.push(`/lobby/${ lobbyId }`);
        }
    });

    gameSocket.on('gameUpdate', (value: Partial<LobbyGame>) => {
        if (!shouldApplyGamePatch(gameStore.game, value)) {
            return;
        }

        gameStore.patchGame(value);

        const currentGameState = value.gameState ?? gameStore.game?.gameState;
        if (currentGameState !== undefined && shouldRouteToLobby(lobbyStore.lobby, router.currentRoute.value.path, lobbyId, currentGameState)) {
            router.push(`/lobby/${ lobbyId }`);
        }
    });

    gameSocket.on('gameEnd', value => {
        gameStore.setGameState(GameState.GameEnd);
        if (value) {
            gameStore.setGameResults(value);
        }
        initializeGameState();
    });

    gameSocket.on('vote', value => {
        if (typeof value === 'object' && value && 'vote' in value && value.vote != 4) {
            voteStore.addVote(value.vote as number, value.userId as number, false);
        }
        else if (typeof value === 'number' && value != 4) {
            voteStore.addVote(value);
        }
    });

    gameSocket.on('unvote', value => {
        if (typeof value === 'object' && value && value.vote && value.userId) {
            voteStore.removeVote(value.vote, value.userId, false);
        }
    });

    gameSocket.on('voted', value => {
        voteStore.setVoted(value as Voted);
    });

    gameSocket.on('roundEnd', () => {
        gameStore.setGameState(GameState.RoundEnd);
        voteStore.resetVote();
    });

    gameSocket.on('givingClue', value => {
        if (!gameStore.game) return;

        const cue = value as GivingClue;
        gameStore.setClue(cue);
        gameStore.setGameState(GameState.Cue);

        lobbyStore.lobby?.wordsSaid.push({
            playerId: cue.player.id,
            word: cue.clue,
            round: gameStore.game.round,
            turn: gameStore.game.turn,
            gameNumber: lobbyStore.lobby.gameNumber,
        });
    });

    gameSocket.on('voting', () => {
        gameStore.setGameState(GameState.Vote);
    });

    gameSocket.on('continue', () => {
        initializeGameState();
        voteStore.resetVote();
    });

    gameSocket.on('start', () => {
        initializeGameState();
        voteStore.resetVote();
        gameStore.setGameResults(null);
        gameStore.setHasVotedForPlayer(false);
        gameStore.setClue(null);
    });

    gameSocket.on('lobbyEnd', () => {
        gameStore.setGameState(GameState.LobbyEnd);
    });

    gameSocket.on('returnToLobby', async () => {
        await router.push(`/lobby/${ lobbyId }`);

        gameStore.resetGameSession();
        voteStore.resetVote();
    });
}

export function useGameSocket(lobbyId: string, options: { onHeart?: () => void } = {}) {
    const appStore = useStore();
    const gameStore = useGameStore();
    const voteStore = useVoteStore();
    const lobbyStore = useLobbyGameStore();

    const { game, clue, gameResults, hasVotedForPlayer } = storeToRefs(gameStore);
    const { voted } = storeToRefs(voteStore);
    const { lobby, connected, spectator, lobbyNotFound, connectionError } = storeToRefs(lobbyStore);

    const myTurn: ComputedRef<boolean> = computed(() => {
        if (!appStore.me?.userid || !game.value?.turn) {
            return false;
        }

        return appStore.me.userid == game.value.turn;
    });

    if (!gameSocket) {
        const {
            lobbySocket,
            disconnect: lobbyDisconnect,
            retry: lobbyRetry,
        } = useLobbySocket(lobbyId, { onDisconnect: disconnectGameSocket });

        gameSocket = lobbySocket;
        disconnect = lobbyDisconnect;
        retry = lobbyRetry;
    }

    const addVote = (vote: number, selfVoted: boolean = false, voterId?: number) => {
        const resolvedUserId = selfVoted ? appStore.me?.userid : voterId;
        voteStore.addVote(vote, resolvedUserId, selfVoted);

        if (selfVoted && gameSocket) {
            gameSocket.emit('vote', vote);
        }
    };

    const removeVote = (vote: number, selfVoted: boolean = false, voterId?: number) => {
        const resolvedUserId = selfVoted ? appStore.me?.userid : voterId;
        voteStore.removeVote(vote, resolvedUserId, selfVoted);

        if (selfVoted && gameSocket) {
            gameSocket.emit('vote', vote);
        }
    };

    const skipWait = () => {
        if (!gameSocket) return;
        gameSocket.emit('skipWait');
    };

    const voteForPlayer = (playerId: number) => {
        if (!gameSocket) return;
        gameSocket.emit('voteForPlayer', playerId);
        gameStore.setHasVotedForPlayer(true);
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

        bindHeartListener(options);
        bindSocketLifecycle(gameStore, voteStore);
        subscribeSocketEvents(lobbyId, gameStore, voteStore, lobbyStore);
        scheduleGameStateSync();
    };

    onMounted(connect);

    onBeforeRouteLeave(to => {
        const allowedPrefixes = [`/game/${ lobbyId }`, `/lobby/${ lobbyId }`];
        const stayingInLobbyFlow = allowedPrefixes.some(prefix => to.path.startsWith(prefix));

        if (!stayingInLobbyFlow) {
            cleanupGameSocketState(gameStore, voteStore);
        }
    });

    return { gameSocket, lobby, game, voted, addVote, removeVote, myTurn, disconnect, connected, clue, skipWait, voteForPlayer, gameResults, nextGame, hasVotedForPlayer, guessWord, lobbyNotFound, connectionError, retry, spectator };
}

