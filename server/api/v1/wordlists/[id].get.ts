import { WordListFetchSelectIncludeWords } from '~~/types/fetch';
import { canReadWordlist } from '~~/server/utils/backend/wordlist-access';

export default defineEventHandler(async event => {
    await requireAuth(event);

    if (!event.context.params?.id) {
        return createApiError('Missing parameter', 400);
    }

    const wordlistId = parseInt(event.context.params?.id, 10);
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
            default: true,
            fromUserId: true,
            shared: true,
            sharedLists: {
                where: {
                    userId: currentUser.userId,
                },
                select: {
                    userId: true,
                },
                take: 1,
            },
        },
    });

    if (!meta) {
        return createApiError('Wordlist does not exist', 400);
    }

    const accessDecision = canReadWordlist({
        fromUserId: meta.fromUserId,
        default: meta.default,
        public: meta.public,
        shared: meta.shared,
        sharedWithUser: meta.sharedLists.length > 0,
    }, {
        userId: currentUser.userId,
        admin: currentUser.admin,
    });

    if (!accessDecision.allowed) {
        return createApiError('Not enough permissions to access this resource', 403);
    }

    const wordlist = await prisma.wordList.findUnique({
        where: {
            id: wordlistId,
        },
        select: {
            ...WordListFetchSelectIncludeWords,
            words: {
                select: WordListFetchSelectIncludeWords.words.select,
                orderBy: {
                    word: 'asc',
                },
            },
        },
    });

    if (!wordlist) {
        return createApiError('Database Error', 400);
    }

    return sendApiDataResponse(event, wordlist, 200);
});
