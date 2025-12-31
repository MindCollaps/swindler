import type { NitroApp } from 'nitropack';
import { defineNitroPlugin } from 'nitropack/runtime';
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io';
import { defineEventHandler } from 'h3';
import { initSocket } from '../socket.io';

export let socketServer: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

export default defineNitroPlugin((nitroApp: NitroApp) => {
    console.log('[Socket.io] Initializing Socket.io server');

    const engine = new Engine();
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || '*';

    console.log(`[Socket.io] CORS allowed origins: ${ Array.isArray(allowedOrigins) ? allowedOrigins.join(', ') : allowedOrigins }`);

    socketServer = new Server({
        cleanupEmptyChildNamespaces: true,
        pingInterval: 25000,
        pingTimeout: 60000,
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    socketServer.bind(engine);

    // Log connection events
    socketServer.on('connection', socket => {
        const clientIp = socket.handshake.address;
        console.log(`[Socket.io] Client connected: ${ socket.id } from IP: ${ clientIp }`);

        socket.on('disconnect', reason => {
            console.log(`[Socket.io] Client disconnected: ${ socket.id }, reason: ${ reason }`);
        });

        socket.on('error', error => {
            console.error(`[Socket.io] Socket error for client ${ socket.id }:`, error);
        });
    });

    initSocket(socketServer);
    console.log('[Socket.io] Socket handlers initialized');

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

    console.log('[Socket.io] Socket.io server ready on /socket.io');
});
