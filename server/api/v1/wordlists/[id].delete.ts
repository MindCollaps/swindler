export default defineEventHandler(async event => {
    await requireAuth(event);

    if (!event.context.params?.id) {
        return createApiError('Missing parameter', 400);
    }

    const wordlistId = parseInt(event.context.params?.id);
    const currentUser = event.context.user;

    if (!wordlistId) {
        return createApiError('Invalid parameter', 400);
    }

    if (!currentUser) {
        return createApiError('Unauthorized', 401);
    }

    // get the details of the requested wordlist
    const meta = await prisma.wordList.findUnique({
        where: {
            id: wordlistId,
        },
        select: {
            public: true,
            system: true,
            from: true,
        },
    });

    if (!meta) {
        return createApiError('Wordlist does not exist', 400);
    }

    // Check the permissions
    // to delete a wordlist from the systen, you have to be an admin
    if (meta.system) {
        if (!currentUser.admin) {
            return createApiError('Not enough permissions to delete this ressource', 403);
        }
    }

    if (meta.from?.id != currentUser.userId) {
        if (!currentUser.admin) {
            return createApiError('Not enough permissions to delete this ressource', 403);
        }
    }

    // TODO: handle shared playlists
    // TODO: delete associated words if not used elsewhere
    const deleted = await prisma.wordList.delete({
        where: {
            id: wordlistId,
        },
    });

    if (!deleted) {
        return createApiError('Could not delete wordlist', 500);
    }

    return sendApiResponse(event, 'Wordlist deleted successfully', 200);
});
