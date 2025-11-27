import type { MeUserObject } from '../../types/socket';
import lobbyHandler from '../socket.io/lobby';
import { parseSocketCookie } from '../utils/auth';
import type { Socket, Namespace, Server, DefaultEventsMap } from 'socket.io';
import type { UserSession } from '../../types/data';
import { socketServer } from '../plugins/socket.io.server';

// const handlers = {

// };

declare module 'socket.io' {
    interface Socket {
        user?: UserSession;
    }
}

const namespaces: Record<string, Namespace> = {};

export function initSocket(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    // for (const [name, handler] of Object.entries(handlers)) {
    //     const namespace = io.of('/' + name)
    //     namespace.on('connection', socket => {
    //         handler(namespace, socket)
    //     })

    //     namespace.use(checkCookies);
    //     console.log(`Namespace /${name} initialized`)
    // }

    io.use(checkCookies);

    io.on('connection', socket => {
        socket.on('me', () => {
            const loggedIn = !!socket.user;
            const data: MeUserObject = {
                loggedIn,
                admin: socket.user?.admin ?? false,
                username: socket.user?.username ?? '',
                userid: socket.user?.userId ?? -1,
            };

            socket.emit('me', data);
        });
    });
}

export function registerLobby(token: string) {
    if (!namespaces[token]) {
        const namespace = socketServer.of(`/lobby-${ token }`);

        namespace.use(checkCookies);
        namespace.use(requireAuth);

        namespace.on('connection', nsSocket => {
            lobbyHandler(namespace, nsSocket, token);
        });

        namespaces[token] = namespace;
        console.log(`Namespace /lobby-${ token } created`);
    }
}

function checkCookies(socket: Socket, next: (err?: Error) => void) {
    parseSocketCookie(socket).then(user => {
        if (!user) return next();
        socket.user = user;
        next();
    }).catch(err => next());
}

function requireAuth(socket: Socket, next: (err?: Error) => void) {
    if (!socket.user?.userId) {
        next(new Error('Unauthorized'));
    }
    else {
        next();
    }
}
