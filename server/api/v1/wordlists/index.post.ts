import { createWordlistSchema } from '~~/server/utils/validation';

export default defineEventHandler(async event => {
    await requireAdminAuth(event);

    const body = await readBody(event);

    const validationResult = createWordlistSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400);
    }

    const { name, description, words } = validationResult.data;

    try {
        // check if wordlist with same name exists
        const existingWordlist = await prisma.wordList.findFirst({
            where: {
                name: name,
            },
        });

        if (existingWordlist) {
            return sendApiResponse(event, 'Wordlist with this name already exists', 409);
        }

        // make sure the words are unique and trimmed
        const uniqueWords = [...new Set(words.map(w => w.trim()))];
        if (uniqueWords.length < 1) {
            return sendApiResponse(event, 'Wordlist must contain at least one unique word', 400);
        }

        const existingWords = await prisma.word.findMany({
            where: { word: { in: uniqueWords } },
        });

        const existingMap = new Map(existingWords.map(w => [w.word, w.id]));
        const missingWords = uniqueWords.filter(w => !existingMap.has(w));

        if (missingWords.length < 1) {
            return sendApiResponse(event, 'All words already exist in the database', 400);
        }

        // create the missing words
        const createdWords = await prisma.word.createManyAndReturn({
            data: missingWords.map(word => ({
                word,
                isCustom: false,
                fromUserId: event.context.user.id,
            })),
            select: { id: true },
        });

        // all word ids to be associated with the wordlist
        const allWordIds = [
            ...existingWords.map(w => ({ id: w.id })),
            ...createdWords.map(w => ({ id: w.id })),
        ];

        const wordList = await prisma.wordList.create({
            data: {
                name,
                description,
                from: event.context.user.id,
                shared: false,
                public: false,
                system: true,
                words: {
                    connect: allWordIds,
                },
            },
            select: { id: true },
        });

        return sendApiDataResponse(event, { id: wordList.id }, 201);
    }
    catch (error) {
        throw createApiError('Failed to create wordlist', 500, error);
    }
});
