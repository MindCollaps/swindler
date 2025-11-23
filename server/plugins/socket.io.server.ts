import type { NitroApp } from 'nitropack';
import { defineNitroPlugin } from 'nitropack/runtime';
import { Server as Engine } from 'engine.io';
import type { Socket, Namespace } from 'socket.io';
import { Server } from 'socket.io';
import { defineEventHandler } from 'h3';
import { parse as parseCookie } from 'cookie';

import { parseSocketCookie } from '../utils/auth';

import lobbyHandler from '../socket.io/lobby';

const handlers = {

};

declare module 'socket.io' {
    interface Socket {
        user?: { id: number; username: string; admin: boolean };
    }
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
    const engine = new Engine();
    const io = new Server();

    const namespaces: Record<string, Namespace> = {};

    io.bind(engine);

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
    });

    nitroApp.router.use('/socket.io', defineEventHandler({
        handler(event) {
            // @ts-expect-error private method and property
            engine.handleRequest(event.node.req, event.node.res);
            event._handled = true;
        },
        websocket: {
            open(peer) {
                // @ts-expect-error private method and property
                engine.prepare(peer._internal.nodeReq);
                // @ts-expect-error private method and property
                engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket);
            },
        },
    }));
});

async function checkCookies(socket: Socket, next: (err?: Error) => void) {
    try {
        const cookiesStr = socket.request.headers.cookie || '';
        const cookies = parseCookie(cookiesStr);
        const token = cookies['auth'];

        if (!token) {
            return next();
        }

        const user = await parseSocketCookie(socket);
        if (!user) {
            return next();
        }

        socket.user = user;
        next();
    }
    catch (err) {
        next(err instanceof Error ? err : new Error('Authentication error'));
    }
}

function requireAuth(socket: Socket, next: (err?: Error) => void) {
    if (!socket.user?.id) {
        next(new Error('Unauthorized'));
    }
    else {
        next();
    }
}
