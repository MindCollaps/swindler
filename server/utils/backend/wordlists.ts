import { prisma } from '~~/server/utils/prisma';
import { redisClient } from './redis';
import type { Lobby } from '~~/types/redis';

export interface ImportWordListResult {
    success: boolean;
    error?: 'ALREADY_EXISTS' | 'NO_WORDS' | 'NO_NEW_WORDS' | 'GENERIC_ERROR' | 'DATABASE_ERROR';
    id?: number;
}

export async function createWordList(
    name: string,
    description: string,
    words: string[],
    userId: number,
    needsNewWords: boolean = true,
    isCustom: boolean = false,
    isShared: boolean = false,
    isPublic: boolean = false,
    isDefault: boolean = false,

): Promise<ImportWordListResult> {
    // check if wordlist with same name exists
    const existingWordlist = await prisma.wordList.findFirst({
        where: {
            name: name,
        },
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

    if (!existingWords) {
        return { success: false, error: 'DATABASE_ERROR' };
    }

    const existingMap = new Map(existingWords.map(w => [w.word, w.id]));
    const missingWords = uniqueWords.filter(w => !existingMap.has(w));

    if (missingWords.length < 1 && needsNewWords) {
        return { success: false, error: 'NO_NEW_WORDS' };
    }

    // create the missing words
    const createdWords = await prisma.word.createManyAndReturn({
        data: missingWords.map(word => ({
            word,
            fromUserId: userId,
        })),
        select: { id: true },
    });

    if (!createdWords) {
        return { success: false, error: 'DATABASE_ERROR' };
    }

    // all word ids to be associated with the wordlist
    const allWordIds = [
        ...existingWords.map(w => ({ id: w.id })),
        ...createdWords.map(w => ({ id: w.id })),
    ];

    const wordList = await prisma.wordList.create({
        data: {
            name,
            description,
            fromUserId: userId,
            shared: isShared,
            public: isPublic,
            default: isDefault,
            custom: isCustom,
            words: {
                connect: allWordIds,
            },
        },
        select: { id: true },
    });

    if (!wordList) {
        return { success: false, error: 'DATABASE_ERROR' };
    }

    return { success: true, id: wordList.id };
}

export async function deleteUnusedWords(wordIds: number[]): Promise<number> {
    const deleted = await prisma.word.deleteMany({
        where: {
            id: { in: wordIds },
            WordLists: {
                none: {},
            },
            // skip and preserve flagged words
            flagged: {
                none: {},
            },
            banned: false,
        },
    });

    return deleted.count;
}

export function lobbyPayloadUsesWordList(lobbyData: string | null | undefined, wordlistId: number): boolean {
    if (!lobbyData) return false;

    try {
        const lobby = JSON.parse(lobbyData) as Lobby;
        return Array.isArray(lobby.wordLists) && lobby.wordLists.includes(wordlistId);
    }
    catch {
        return false;
    }
}

export async function isWordListInUse(wordlistId: number): Promise<boolean> {
    let cursor = '0';

    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', 'lobby-*', 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length === 0) {
            continue;
        }

        const lobbies = await redisClient.mget(...keys);
        const used = lobbies.some(lobbyData => lobbyPayloadUsesWordList(lobbyData, wordlistId));

        if (used) {
            return true;
        }
    }
    while (cursor !== '0');

    return false;
}
