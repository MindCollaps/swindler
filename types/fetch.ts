import type { Prisma } from '@prisma/client';

export const LobbysWordListSelect = {
    id: true,
    name: true,
    system: true,
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

export const LobbysPlayerSelect = {

};

export const WordListFetchSelect = {
    id: true,
    name: true,
    description: true,
    words: {
        select: {
            id: true,
            word: true,
            isCustom: true,
        },
    },
    public: true,
    system: true,
};

export type FetchingWordList = Prisma.WordListGetPayload<{
    select: typeof WordListFetchSelect;
}>;
