export interface UserSession {
    admin: boolean;
    username: string;
    userId: number;
    timeStamp: number;
    fakeUser: boolean;
    developer: boolean;
}

export const AVATAR_DEFINITIONS = {
    body: { max: 2, optional: false },
    face: { max: 2, optional: false },
    clothing: { max: 3, optional: false },
    hair: { max: 1, optional: true },
} as const;

type Range<N extends number, T extends any[] = [any]> = 
    T['length'] extends N 
    ? T['length'] 
    : T['length'] | Range<N, [...T, any]>;

type AvatarDef = typeof AVATAR_DEFINITIONS;

export type Avatar = {
    [K in keyof AvatarDef]: AvatarDef[K]['optional'] extends true
        ? Range<AvatarDef[K]['max']> | undefined
        : Range<AvatarDef[K]['max']>;
};
