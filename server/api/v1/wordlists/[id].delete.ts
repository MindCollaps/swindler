import { deleteUnusedWords } from '~~/server/utils/backend/wordlists';

export default defineEventHandler(async event => {
    await requireAuth(event);

    if (!event.context.params?.id) {
        console.warn('[Wordlist:Delete] Missing wordlist ID parameter');
        return createApiError('Missing parameter', 400);
    }

    const wordlistId = parseInt(event.context.params?.id, 10);
    const currentUser = event.context.user;

    if (!wordlistId) {
        console.warn('[Wordlist:Delete] Invalid wordlist ID parameter');
        return createApiError('Invalid parameter', 400);
    }

    if (!currentUser) {
        console.warn('[Wordlist:Delete] Unauthorized access attempt');
        return createApiError('Unauthorized', 401);
    }

    console.log(`[Wordlist:Delete] User ${ currentUser.username } (ID: ${ currentUser.userId }) attempting to delete wordlist ID: ${ wordlistId }`);

    // get the details of the requested wordlist
    const wordList = await prisma.wordList.findUnique({
        where: {
            id: wordlistId,
        },
        include: { words: { select: { id: true } } },
    });

    if (!wordList) {
        console.warn(`[Wordlist:Delete] Wordlist not found: ID ${ wordlistId }`);
        return createApiError('Wordlist does not exist', 400);
    }

    // Check the permissions
    // to delete a wordlist from the systen, you have to be an admin
    if (wordList.default) {
        if (!currentUser.admin) {
            console.warn(`[Wordlist:Delete] Non-admin user ${ currentUser.username } attempted to delete default wordlist ID: ${ wordlistId }`);
            return createApiError('Not enough permissions to delete this ressource', 403);
        }
    }

    if (wordList.fromUserId != currentUser.userId) {
        if (!currentUser.admin) {
            console.warn(`[Wordlist:Delete] User ${ currentUser.username } attempted to delete wordlist owned by another user (ID: ${ wordlistId })`);
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
        console.log(`[Wordlist:Delete] Deleted ${ deletedWords } orphaned words from wordlist ID: ${ wordlistId }`);
    }

    if (!deleted) {
        console.error(`[Wordlist:Delete] Failed to delete wordlist ID: ${ wordlistId }`);
        return createApiError('Could not delete wordlist', 500);
    }

    console.log(`[Wordlist:Delete] Successfully deleted wordlist ID: ${ wordlistId } by user: ${ currentUser.username }`);
    return sendApiResponse(event, 'Wordlist deleted successfully', 200);
});
