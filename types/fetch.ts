import type { Prisma } from '@prisma/client';

export const LobbysWordListSelect = {
    id: true,
    name: true,
    default: true,
    description: true,
    from: {
        select: {
            username: true,
        },
    },
};

export type LobbysWordList = Prisma.WordListGetPayload<{
    select: typeof LobbysWordListSelect;
}>;

export const WordListFetchSelect = {
    id: true,
    name: true,
    description: true,
    // words: {
    //     select: {
    //         id: true,
    //         word: true,
    //     },
    // },
    public: true,
    default: true,
};

export const WordListFetchSelectIncludeWords = {
    id: true,
    name: true,
    description: true,
    words: {
        select: {
            id: true,
            word: true,
        },
    },
    public: true,
    default: true,
    custom: true,
};

export type FetchingWordList = Prisma.WordListGetPayload<{
    select: typeof WordListFetchSelect;
}>;

export type FetchingWordListWithWords = Prisma.WordListGetPayload<{
    select: typeof WordListFetchSelectIncludeWords;
}>;
