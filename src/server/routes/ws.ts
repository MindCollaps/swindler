import type { UserSession } from '#auth-utils';
import type { Peer } from 'crossws';
import type { Game, Lobby, User } from '~/types/backend/db';
import type { AsCreateDatabaseObject } from '~/types/backend/request';
import { serverData } from '~/utils/data';
import { convertGame, convertLobby } from '../utils/convert';
import { createToken } from '~/utils';

type LobbyAction = 'join' | 'create' | 'game_start';
type GameAction = 'join' | 'vote' | 'sendWord';

type WSMessage =
  { topic: 'lobby'; action: LobbyAction; data: any } |
  { topic: 'game'; action: GameAction; data: any };

type WSLobbyMessage = Extract<WSMessage, { topic: 'lobby' }>;
type WSGameMessage = Extract<WSMessage, { topic: 'game' }>;

export default defineWebSocketHandler({
    open(peer) {
    },
    async message(peer, message) {
        let dataString: string;
        let wsmessage: WSMessage | undefined;

        if (typeof message.data === 'string') {
            dataString = message.data;
        }
        else if (Buffer.isBuffer(message.data)) {
            dataString = message.data.toString('utf-8');
        }
        else if (message.data instanceof ArrayBuffer) {
            dataString = Buffer.from(message.data).toString('utf-8');
        }
        else {
            console.error('Unsupported message data type', typeof message.data);
            return;
        }

        try {
            wsmessage = JSON.parse(dataString);
        }
        catch (err) {
            console.error('Failed to parse message data as JSON', err);
            return;
        }

        if (!wsmessage) {
            console.error('Failed to parse message data as JSON');
            return;
        }

        const session = await getUserSession(peer);

        switch (wsmessage.topic) {
            case 'lobby':
                handleLobbyMessage(peer, session, wsmessage as WSLobbyMessage);
                break;
            case 'game': {
                handleGameMessage(peer, session, wsmessage as WSGameMessage);
            }
        }
    },
    close(peer) {
        let lobbyId: string | undefined;
        // let gameId: string | undefined;

        peer.topics.forEach(x => {
            if (x.startsWith('lobby/')) {
                lobbyId = x.substring(6);
                peer.unsubscribe(x);
            }
            else if (x.startsWith('game/')) {
                // gameId = x.substring(5);
                peer.unsubscribe(x);
            }
        });

        if (lobbyId) {
            const lobby = serverData.lobbies.find(x => x.token === lobbyId);
            if (lobby) {
                // Todo: Make it right
                lobby.players.pop();
                peer.publish('lobby/' + lobbyId, JSON.stringify({ action: 'lobby', lobby: convertLobby(lobby, -1) }));
            }
        }
    },
});

function handleLobbyMessage(peer: Peer, session: UserSession, message: WSLobbyMessage) {
    switch (message.action) {
        case 'join': {
            const lobbyId = message.data.lobbyId as string;
            const lobby = serverData.lobbies.find(x => x.token === lobbyId);
            if (lobby) {
                lobby.players.push({
                    id: -1,
                    admin: false,
                    email: 'test@example.com',
                    emailVerified: true,
                    flaggedWords: [],
                    foundedLobbies: [],
                    friendOf: [],
                    gamesPlayed: 0,
                    initiatedEvents: [],
                    level: 0,
                    ownedWordLists: [],
                    password: '0',
                    playedWords: [],
                    receivedEvents: [],
                    staredWordLists: [],
                    userFriends: [],
                    username: 'Test Name',
                    xp: 0,
                });

                const sendData = JSON.stringify({ action: 'lobby', lobby: convertLobby(lobby, -1) });

                peer.send(sendData);
                peer.publish('lobby/' + message.data.lobbyId, sendData);
                peer.subscribe('lobby/' + message.data.lobbyId);
            }
            else {
                peer.send({ action: 'leave_lobby' });
            }
            break;
        }
        case 'game_start': {
            let lobbyId: string | undefined;
            peer.topics.forEach(x => x.startsWith('lobby/') ? lobbyId = x.substring(6) : '');

            const lobby = serverData.lobbies.find(x => x.token === lobbyId);

            if (lobbyId && lobby) {
                const game: AsCreateDatabaseObject<Game> = {
                    imposter: 0,
                    lobbyId: lobby.id,
                    round: 0,
                    turn: 0,
                    specialGameMode: 0,
                    word: lobby.wordLists[0].words[0],
                    id: undefined,
                };

                peer.peers.forEach(p => {
                    const set: Set<string> = new Set();
                    set.add('lobby/' + (lobbyId as string));
                    if (set.isSubsetOf(p.topics)) {
                        p.send(JSON.stringify({ action: 'game_start', game }));
                    }
                });
            }
            break;
        }
        case 'create': {
            const token = createToken();

            if (!session.user) {
                throw createError({
                    statusCode: 401,
                    statusMessage: 'Unauthorized!',
                });
            }

            const founder: AsCreateDatabaseObject<User> = serverData.users.find(x => x.id === session.user?.userId) ?? {
                id: undefined,
                admin: false,
                email: 'test@example.com',
                emailVerified: true,
                flaggedWords: [],
                foundedLobbies: [],
                friendOf: [],
                gamesPlayed: 0,
                initiatedEvents: [],
                level: 0,
                ownedWordLists: [],
                password: '0',
                playedWords: [],
                receivedEvents: [],
                staredWordLists: [],
                userFriends: [],
                username: 'Test Name',
                xp: 0,
            };
            // todo use frckn backend

            const lobby: AsCreateDatabaseObject<Lobby> = {
                id: undefined,
                founder,
                founded: new Date(),
                gameEvents: [],
                gameStarted: false,
                players: [],
                public: false,
                round: 0,
                wordLists: [{
                    id: undefined,
                    public: true,
                    shared: false,
                    stars: [],
                    system: true,
                    usersWorldLists: [],
                    words: [{
                        flagged: [],
                        games: [],
                        id: undefined,
                        isCustom: false,
                        word: 'Bär',
                        worldLists: [],
                        fromUserId: undefined,
                    }],
                    founderId: -1,
                }],
                token,
            };

            // TODO: BACKEND!!!

            serverData.lobbies.push(lobby as Lobby);

            const lobbyData = convertLobby(lobby as Lobby, session.user.userId);

            peer.subscribe('lobby/' + token);
            peer.send({ action: 'lobby', lobby: lobbyData });
            break;
        }
    }
}

function handleGameMessage(peer: Peer, session: UserSession, message: WSGameMessage) {
    switch (message.action) {
        case 'join': {
            if (!session.user) {
                throw createError({
                    statusCode: 401,
                    statusMessage: 'Unauthorized!',
                });
            }

            const lobbyId = message.data.lobbyId;
            const lobby = serverData.lobbies.find(x => x.token === lobbyId);

            if (lobby) {
                const game: AsCreateDatabaseObject<Game> = {
                    id: -1,
                    imposter: 0,
                    lobbyId: lobbyId,
                    round: 0,
                    specialGameMode: 0,
                    turn: 0,
                };

                // TODO: BACKEND!!!
                serverData.games.push(game as Game);

                peer.send(JSON.stringify({ action: 'game', game: convertGame(game as Game, session.user.userId) }));
                peer.send(JSON.stringify({ action: 'lobby', lobby: convertLobby(lobby, session.user.userId) }));
                peer.subscribe('game/' + lobbyId);
            }
            break;
        }
        case 'sendWord': {
            break;
        }
        case 'vote': {
            break;
        }
    }
}
