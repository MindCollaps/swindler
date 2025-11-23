import type { Prisma } from '@prisma/client';

export type PartialRecord<K extends keyof any, T> = {
    [P in K]?: T;
};

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
