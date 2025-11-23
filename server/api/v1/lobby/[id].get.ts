import { LobbyFetchSelect } from '~~/types/fetch';

export default defineEventHandler(async event => {
    // TODO: await requireAuth(event);
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
