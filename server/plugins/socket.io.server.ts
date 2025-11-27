import type { NitroApp } from 'nitropack';
import { defineNitroPlugin } from 'nitropack/runtime';
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io';
import { defineEventHandler } from 'h3';
import { initSocket } from '../socket.io';

export let socketServer: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

export default defineNitroPlugin((nitroApp: NitroApp) => {
    const engine = new Engine();
    socketServer = new Server({
        cleanupEmptyChildNamespaces: true,
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    socketServer.bind(engine);

    initSocket(socketServer);

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
