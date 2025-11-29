import { SingleWordListFetchSelect } from '~~/types/fetch';

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
    // it has to be either the users own wordlist or one from the system
    // however admins can access everything
    // TODO: handle shared playlists
    if (!meta.public && !meta.system) {
        if (meta.from?.id != currentUser.userId) {
            if (!currentUser.admin) {
                return createApiError('Not enough permissions to access this ressource', 403);
            }
        }
    }

    const wordlist = await prisma.wordList.findUnique({
        where: {
            id: wordlistId,
        },
        select: SingleWordListFetchSelect,
    });

    if (!wordlist) {
        return createApiError('Database Error', 400);
    }

    return sendApiDataResponse(event, wordlist, 200);
});
