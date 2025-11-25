import type { Namespace, Socket } from 'socket.io';
import { prisma } from '../utils/prisma';
import { LobbyFetchSelect, LobbysWordListSelect } from '../../types/fetch';

export default async function lobbyHandler(namespace: Namespace, socket: Socket, id: string) {
    const userId = socket.user?.userId;

    if (!userId) {
        // TODO handle error
        console.log('No user id found!');
        return;
    }

    const lobby = await prisma.lobby.findUnique({
        where: {
            token: id,
        },
        select: LobbyFetchSelect,
    });

    socket.emit('lobby', lobby);

    const wordLists = await prisma.wordList.findMany({
        where: {
            OR: [
                { fromUserId: userId },
                { public: true },
                { shared: true, sharedLists: { some: { userId: userId } } },
            ],
        },
        select: LobbysWordListSelect,
    });

    socket.emit('wordLists', wordLists);
}
