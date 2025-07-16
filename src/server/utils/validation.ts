import { z } from 'zod';

export const signupSchema = z.object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(64),
    passwordRepeated: z.string().min(8).max(64),
    email: z.string().email(),
}).strict();

export const loginSchema = z.object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(64),
}).strict();
