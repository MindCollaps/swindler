import { LobbyFetchSelect } from '~~/types';

export default defineEventHandler(async event => {
    const lobbyId = event.context.params?.id;

    const lobby = await prisma.lobby.findUnique({
        where: {
            token: lobbyId,
        },
        select: LobbyFetchSelect,
    });

    if (!lobby) {
        return createApiError('Lobby does not exist', 400);
    }

    return lobby;
});
