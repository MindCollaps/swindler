import { z } from 'zod';

export const signupSchema = z.object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(64),
    passwordRepeated: z.string().min(8).max(64),
    email: z.string().email(),
}).strict();

export const loginSchema = z.object({
    username: z.string().min(3).max(32),
    password: z.string().min(3).max(64),
}).strict();

export const WordlistCreationSchema = z.object({
    name: z.string().min(3).max(64),
    description: z.string().max(256),
    words: z.array(z.string().min(1).max(64)).min(1),
    isCustom: z.boolean(),
    isPublic: z.boolean(),
    isSystem: z.boolean(),
}).strict();

export const lobbyCreationResponseSchema = z.object({
    public: z.boolean(),
    maxRounds: z.number().int().min(1).max(10),
    rounds: z.number().int().min(1).max(10),
    maxPlayers: z.number().int().min(1).max(10),
    timeLimited: z.boolean(),
    timeLimit: z.number().int().min(0),
    membersCanAddWordLists: z.boolean(),
    membersCanAddCustomWordLists: z.boolean(),
});
