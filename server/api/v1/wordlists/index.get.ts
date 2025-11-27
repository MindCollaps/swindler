import { WordListFetchSelect } from '~~/types/fetch';

export default defineEventHandler(async event => {
    await requireAuth(event);

    const currentUser = event.context.user;
    if (!currentUser) {
        return createApiError('Unauthorized', 401);
    }

    let wordlists;
    if (!currentUser.admin) {
        wordlists = await prisma.wordList.findMany({
            where: {
                OR: [
                    { public: true },
                    { system: true },
                    { fromUserId: currentUser.userId },
                    { shared: true, sharedLists: { some: { userId: currentUser.userId } } },
                ],
            },
            select: WordListFetchSelect,
        });
    }
    else {
        wordlists = await prisma.wordList.findMany({
            select: WordListFetchSelect,
        });
    }

    if (!wordlists) {
        return createApiError('Database Error', 500);
    }

    return sendApiDataResponse(event, wordlists, 200);
});
