import type { MeUserObject } from '../../types/socket';
import lobbyHandler from '../socket.io/lobby';
import { parseSocketCookie } from '../utils/auth';
import type { Socket, Namespace, Server, DefaultEventsMap } from 'socket.io';
import type { UserSession } from '../../types/data';

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
        socket.on('lobby', async value => {
            if (!namespaces[value]) {
                const namespace = io.of(`/lobby-${ value }`);

                namespace.use(checkCookies);
                namespace.use(requireAuth);

                namespace.on('connection', nsSocket => {
                    lobbyHandler(namespace, nsSocket, value);
                });

                namespaces[value] = namespace;
                console.log(`Namespace /lobby-${ value } created`);
            }

            socket.emit('lobby', value);
        });

        socket.on('me', () => {
            const loggedIn = !!socket.user;
            const data: MeUserObject = {
                loggedIn,
                admin: socket.user?.admin ?? false,
                username: socket.user?.username ?? '',
            };

            socket.emit('me', data);
        });
    });
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
