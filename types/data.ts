import atlas from '../app/utils/avatarAtlas.json';

export interface UserSession {
    admin: boolean;
    username: string;
    userId: number;
    timeStamp: number;
    fakeUser: boolean;
    developer: boolean;
    random: string;
}

export const AVATAR_DEFINITIONS = {
    body: { max: atlas.parts.body.length, optional: false },
    eyes: { max: atlas.parts.eyes.length, optional: false },
    mouth: { max: atlas.parts.mouth.length, optional: false },
    cloth: { max: atlas.parts.cloth.length, optional: false },
    hair: { max: atlas.parts.hair.length, optional: true },
    accessory1: { max: atlas.parts.acc.length, optional: true },
    accessory2: { max: atlas.parts.acc.length, optional: true },
} as const;

type AvatarDef = typeof AVATAR_DEFINITIONS;

export type Avatar = {
    -readonly [K in keyof AvatarDef]: AvatarDef[K]['optional'] extends true
        ? number | undefined
        : number;
};
