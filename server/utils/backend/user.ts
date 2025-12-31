import { prisma } from '~~/server/utils/prisma';
import { hashPassword } from '~~/server/utils/crypto/password';
import type { User } from '@prisma/client';
import type { FakeUser } from '~~/types/redis';

interface CreateUserResult {
    success: boolean;
    user?: User;
    error?: 'ALREADY_EXISTS' | 'DATABASE_ERROR';
}

interface CreateFakeUserResult {
    success: boolean;
    user?: FakeUser;
}

export async function createUser(
    username: string,
    email: string,
    password: string,
    admin: boolean = false,
    disabled: boolean = false,
    developer: boolean = false,
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
                developer,
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

export async function createFakeUser(
    nickname: string,
    lobby: string,
): Promise<CreateFakeUserResult> {
    nickname = nickname.toLowerCase();

    const newUserId = await getFakeUserNextId();

    const fakeUser: FakeUser = {
        lobby,
        nickname,
        id: newUserId,
    };

    return {
        success: true,
        user: fakeUser,
    };
}

export async function getFakeUserNextId(): Promise<number> {
    const redisIdIdentifier = 'fakeuser-neg-id';
    const redisId = await getRedisSync(redisIdIdentifier);
    let id: number | undefined;

    if (!redisId) {
        id = -1;
    }
    else {
        id = parseInt(redisId, 10);
        id -= 1;
    }

    setRedisSync(redisIdIdentifier, id.toString(), 7 * 24 * 60 * 60 * 1000);
    return id;
}
