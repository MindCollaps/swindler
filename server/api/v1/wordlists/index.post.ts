import { WordlistCreationSchema } from '~~/server/utils/backend/validation';
import type { ImportWordListResult } from '~~/server/utils/backend/wordlists';
import { createWordList } from '~~/server/utils/backend/wordlists';

export default defineEventHandler(async event => {
    await requireAuth(event);

    const body = await readBody(event);
    const currentUser = event.context.user;

    if (!currentUser) {
        return createApiError('Unauthorized', 401);
    }

    // needsNewWords: boolean --> false --> admins and users can create custom wordlists that contain already existing words
    // isCustom: boolean = false --> if from admin, true if from user

    const validationResult = WordlistCreationSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const data = validationResult.data;

    const isShared = false; // defaults to false and can be changed later when the sharing is triggered

    // only admins can create default system wordlists
    if (data.isDefault) {
        await requireAdminAuth(event);
    }
    else {
        data.isCustom = true; // all created wordlists are custom by default, but admins can change this
    }

    if (data.isDefault && !data.isPublic) {
        return createApiError('Default wordlists have to be public!', 400);
    }

    if (data.isDefault && data.isCustom) {
        return createApiError('Default wordlists cannot be custom!', 400);
    }

    const result: ImportWordListResult = await createWordList(
        data.name,
        data.description,
        data.words,
        currentUser.userId,
        false, // Words may already exist but not the standard wordlist itself
        data.isCustom,
        isShared,
        data.isPublic, // choice of the creator, but default wordlists should be public
        data.isDefault, // default wordlist
    );

    if (!result.success) {
        // skip NO_NEW_WORDS
        if (result.error == 'NO_WORDS' || result.error == 'GENERIC_ERROR' || result.error == 'DATABASE_ERROR') {
            console.error(`Failed to create the wordlist: ${ result.error }`);
            return createApiError('Failed to create the wordlist', 500);
        }

        if (result.error == 'ALREADY_EXISTS') {
            return createApiError('A wordlist with the same name already exists', 400);
        }
    }

    return sendApiDataResponse(event, { id: result.id }, 200);
});
