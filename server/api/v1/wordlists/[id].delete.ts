import { deleteUnusedWords, isWordListInUse } from '~~/server/utils/backend/wordlists';
import { canDeleteWordlist } from '~~/server/utils/backend/wordlist-access';

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

    const wordIds = wordList.words.map(w => w.id) || [];

    const inUse = await isWordListInUse(wordlistId);

    const deleteDecision = canDeleteWordlist({
        fromUserId: wordList.fromUserId,
        default: wordList.default,
        public: wordList.public,
    }, {
        userId: currentUser.userId,
        admin: currentUser.admin,
    }, inUse);

    if (!deleteDecision.allowed && deleteDecision.reason === 'in_use') {
        console.warn(`[Wordlist:Delete] Wordlist ID ${ wordlistId } is currently used by at least one lobby`);
        return createApiError('Wordlist is currently in use by an active lobby', 409);
    }

    if (!deleteDecision.allowed) {
        console.warn(`[Wordlist:Delete] User ${ currentUser.username } has insufficient permission to delete wordlist ID: ${ wordlistId }`);
        return createApiError('Not enough permissions to delete this resource', 403);
    }

    const deleted = await prisma.wordList.delete({
        where: {
            id: wordlistId,
        },
    });

    // do it after the wordlist was deleted, because otherwise the words are still linked to it
    if (wordIds.length > 0) {
        const deletedWords = await deleteUnusedWords(wordIds);
        console.log(`[Wordlist:Delete] Deleted ${ deletedWords } orphaned words from wordlist ID: ${ wordlistId }`);
    }

    if (!deleted) {
        console.error(`[Wordlist:Delete] Failed to delete wordlist ID: ${ wordlistId }`);
        return createApiError('Could not delete wordlist', 500);
    }

    console.log(`[Wordlist:Delete] Successfully deleted wordlist ID: ${ wordlistId } by user: ${ currentUser.username }`);
    return sendApiResponse(event, 'Wordlist deleted successfully', 200);
});
