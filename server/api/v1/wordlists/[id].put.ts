// TODO: new words -> id = -1
// TODO: words to delete from wordlist-> make diff

import { WordlistUpdateSchema } from '~~/server/utils/backend/validation';
import type { Prisma } from '@prisma/client';

export default defineEventHandler(async event => {
    await requireAuth(event);

    if (!event.context.params?.id) {
        return createApiError('Missing parameter', 400);
    }

    const body = await readBody(event);
    const wordlistId = parseInt(event.context.params?.id);
    const currentUser = event.context.user;

    if (!wordlistId) {
        return createApiError('Invalid parameter', 400);
    }

    if (!currentUser) {
        return createApiError('Unauthorized', 401);
    }

    const validationResult = WordlistUpdateSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const postData = validationResult.data;

    const uniqueWords = [...new Set(
        postData.words
            .map(w => w.trim())
            .filter(Boolean),
    )];

    await prisma.$transaction(async tx => {
        const existingWordlist = await tx.wordList.findUnique({
            where: {
                id: wordlistId,
            },
            include: {
                words: true,
                from: true,
            },
        });

        if (!existingWordlist) return createApiError('Invalid input', 400, validationResult.error);

        // same permission checks etc., but using tx instead of prisma

        const existingWords = await tx.word.findMany({
            where: { word: { in: uniqueWords } },
        });

        const existingMap = new Map(existingWords.map(w => [w.word, w.id]));
        const missingWords = uniqueWords.filter(w => !existingMap.has(w));

        const createdWords = await tx.word.createManyAndReturn({
            data: missingWords.map(word => ({
                word,
                fromUserId: currentUser.userId,
            })),
            select: { id: true, word: true },
        });

        const allWordIds = [
            ...existingWords.map(w => ({ id: w.id })),
            ...createdWords.map(w => ({ id: w.id })),
        ];

        const incomingWordSet = new Set(uniqueWords);
        const deletedWords = existingWordlist.words.filter(w => !incomingWordSet.has(w.word));
        const deletedWordIds = deletedWords.map(w => w.id);

        const updatedWordlist = await tx.wordList.update({
            where: { id: wordlistId },
            data: {
                description: postData.description,
                custom: postData.isCustom,
                public: postData.isPublic,
                default: postData.isDefault,
                words: { set: allWordIds },
            },
        });

        if (deletedWordIds.length > 0) {
            await deleteUnusedWordsTx(tx, deletedWordIds);
        }

        return updatedWordlist;
    });


    return { refresh: true };
});

async function deleteUnusedWordsTx(tx: Prisma.TransactionClient, wordIds: number[]): Promise<number> {
    const deleted = await tx.word.deleteMany({
        where: { id: { in: wordIds }, WordLists: { none: {} }, flagged: { none: {} }, banned: false },
    });
    return deleted.count;
}
