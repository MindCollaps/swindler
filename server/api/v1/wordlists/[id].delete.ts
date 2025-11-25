import { deleteUnusedWords } from "~~/server/utils/backend/wordlists";

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
    const wordList = await prisma.wordList.findUnique({
        where: {
            id: wordlistId,
        },
        include: { words: { select: { id: true } } }
    });

    if (!wordList) {
        return createApiError('Wordlist does not exist', 400);
    }

    // Check the permissions
    // to delete a wordlist from the systen, you have to be an admin
    if (wordList.system) {
        if (!currentUser.admin) {
            return createApiError('Not enough permissions to delete this ressource', 403);
        }
    }

    if (wordList.fromUserId != currentUser.userId) {
        if (!currentUser.admin) {
            return createApiError('Not enough permissions to delete this ressource', 403);
        }
    }

    const wordIds = wordList.words.map(w => w.id) || [];

    // TODO: handle shared playlists
    // TODO: make sure the wordlist isn't currently in use by any game lobby
    const deleted = await prisma.wordList.delete({
        where: {
            id: wordlistId,
        },
    });

    // do it after the wordlist was deleted, because otherwise the words are still linked to it
    let deletedWords = 0; 
    if (wordIds.length > 0) {
        deletedWords = await deleteUnusedWords(wordIds);
        console.log(`Deleted ${deletedWords} linked words that weren't in any other wordlist`);
    }

    if (!deleted) {
        return createApiError('Could not delete wordlist', 500);
    }

    return sendApiResponse(event, 'Wordlist deleted successfully', 200);
});
