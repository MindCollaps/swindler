import { prisma } from '~~/server/utils/prisma';
import { hashPassword } from '~~/server/utils/crypto/password';
import type { User } from '@prisma/client';

interface CreateUserResult {
    success: boolean;
    user?: User;
    error?: 'ALREADY_EXISTS' | 'DATABASE_ERROR';
}

export async function createUser(
    username: string,
    email: string,
    password: string,
    admin: boolean = false,
    disabled: boolean = false,
): Promise<CreateUserResult> {
    username = username.toLowerCase(); // always use the lowercase username!!

    // check if the username or mail already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: username },
                { email: email },
            ],
        },
    });

    if (existingUser) {
        return { success: false, error: 'ALREADY_EXISTS', user: existingUser };
    }

    const hashedPW = await hashPassword(password);
    if (!hashedPW) {
        return { success: false, error: 'DATABASE_ERROR' };
    }

    try {
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPW,
                email,
                admin,
                disabled,
            },
        });

        if (!newUser) {
            return { success: false, error: 'DATABASE_ERROR' };
        }

        return { success: true, user: newUser };
    }
    catch {
        return { success: false, error: 'DATABASE_ERROR' };
    }
}
