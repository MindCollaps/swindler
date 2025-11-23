import type { Prisma } from '@prisma/client';

export const LobbyFetchSelect = {
    token: true,
    founder: {
        select: {
            username: true,
        },
    },
    gameStarted: true,
    public: true,
    gameRules: {
        include: {
            lobby: true,
        },
        omit: {
            id: true,
        },
    },
} as const;

export type FetchingLobby = Prisma.LobbyGetPayload<{
    select: typeof LobbyFetchSelect;
}>;

export const LobbysWordListSelect = {
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
    name: true,
    description: true,
    words: {
        select: {
            id: true,
            word: true,
            isCustom: true,
        },
    },
};

export type FetchingWordList = Prisma.WordListGetPayload<{
    select: typeof WordListFetchSelect;
}>;
