import { prisma } from '~~/server/utils/prisma';

interface ImportWordListResult {
    success: boolean;
    error?: 'ALREADY_EXISTS' | 'NO_WORDS' | 'NO_NEW_WORDS';
    data?: { id: number };
}

export async function importWordList(
    name: string,
    description: string,
    words: string[],
    userId: number | null,
    options: { requireNewWords?: boolean } = {},
): Promise<ImportWordListResult> {
    // check if wordlist with same name exists
    const existingWordlist = await prisma.wordList.findFirst({
        where: { name },
    });

    if (existingWordlist) {
        return { success: false, error: 'ALREADY_EXISTS' };
    }

    // make sure the words are unique and trimmed
    const uniqueWords = [...new Set(words.map(w => w.trim()).filter(w => w.length > 0))];
    if (uniqueWords.length < 1) {
        return { success: false, error: 'NO_WORDS' };
    }

    const existingWords = await prisma.word.findMany({
        where: { word: { in: uniqueWords } },
    });

    const existingMap = new Set(existingWords.map(w => w.word));
    const missingWords = uniqueWords.filter(w => !existingMap.has(w));

    // Optional check: enforce that at least one new word is added (logic from your original endpoint)
    if (options.requireNewWords && missingWords.length < 1) {
        return { success: false, error: 'NO_NEW_WORDS' };
    }

    // create the missing words
    const createdWords = await prisma.word.createManyAndReturn({
        data: missingWords.map(word => ({
            word,
            isCustom: false,
            fromUserId: userId,
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
            from: userId,
            shared: false,
            public: false,
            system: true,
            words: {
                connect: allWordIds,
            },
        },
        select: { id: true },
    });

    return { success: true, data: wordList };
}
