import { z } from 'zod';

// Password validation: at least 8 chars with complexity requirements
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must not exceed 64 characters')
    .refine(
        password => /[a-z]/.test(password),
        'Password must contain at least one lowercase letter',
    )
    .refine(
        password => /[A-Z]/.test(password),
        'Password must contain at least one uppercase letter',
    )
    .refine(
        password => /[0-9]/.test(password),
        'Password must contain at least one number',
    );

export const signupSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(32, 'Username must not exceed 32 characters').transform(val => val.trim()),
    password: passwordSchema,
    passwordRepeated: passwordSchema,
    email: z.string().email('Invalid email address').transform(val => val.toLowerCase().trim()),
}).strict();

export const joinSchema = z.object({
    nickname: z.string().min(3, 'Nickname must be at least 3 characters').max(32, 'Nickname must not exceed 32 characters').transform(val => val.trim()),
    lobby: z.string().min(8).max(8),
}).strict();

// Login schema uses basic password validation (not strict requirements)
// to allow users with old passwords to still log in
export const loginSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(32, 'Username must not exceed 32 characters').transform(val => val.trim()),
    password: z.string().min(3, 'Password must be at least 3 characters').max(64, 'Password must not exceed 64 characters'),
}).strict();

export const WordlistCreationSchema = z.object({
    name: z.string().min(3).max(64).transform(val => val.trim()),
    description: z.string().max(256).transform(val => val.trim()),
    words: z.array(z.string().min(1).max(64).transform(val => val.trim())).min(1),
    isCustom: z.boolean(),
    isPublic: z.boolean(),
    isDefault: z.boolean(),
}).strict();

export const WordlistUpdateSchema = z.object({
    // name: z.string().min(3).max(64),
    description: z.string().max(256).transform(val => val.trim()),
    words: z.array(z.string().min(1).max(64).transform(val => val.trim())).min(1),
    isCustom: z.boolean(),
    isPublic: z.boolean(),
    isDefault: z.boolean(),
}).strict();

export const lobbyCreationResponseSchema = z.object({
    public: z.boolean(),
    games: z.number().int().min(1, 'Games must be at least 1').max(10, 'Games must not exceed 10'),
    rounds: z.number().int().min(1, 'Rounds must be at least 1').max(10, 'Rounds must not exceed 10'),
    maxPlayers: z.number().int().min(1, 'Max Players must be at least 1').max(10, 'Max Players must not exceed 10'),
    timeLimited: z.boolean(),
    timeLimit: z.number().int().min(0, 'Time Limit must be at least 0'),
    membersCanAddWordLists: z.boolean(),
    membersCanAddCustomWordLists: z.boolean(),
});

export const FlagWordSchema = z.object({
    wordId: z.number().int().min(0),
    reason: z.number().int().min(0),
    message: z.string().max(256).transform(val => val.trim()),
});
