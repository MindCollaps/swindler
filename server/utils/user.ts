import { prisma } from '~~/server/utils/prisma';
import { hashPassword } from '~~/server/utils/crypto/password';

interface CreateUserResult {
    success: boolean;
    user?: any;
    error?: string;
}

export async function createUser(
    username: string,
    email: string,
    password: string,
    admin: boolean = false,
): Promise<CreateUserResult> {
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
        return { success: false, error: 'ALREADY_EXISTS' };
    }

    const hashedPW = await hashPassword(password);
    if (!hashedPW) {
        return { success: false, error: 'GENERIC_ERROR' };
    }

    try {
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPW,
                email,
                admin,
            },
        });

        if (!newUser) {
            return { success: false, error: 'GENERIC_ERROR' };
        }

        return { success: true, user: newUser };
    }
    catch {
        return { success: false, error: 'GENERIC_ERROR' };
    }
}
