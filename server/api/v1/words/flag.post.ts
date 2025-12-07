import { FlagWordSchema } from '~~/server/utils/backend/validation';

export default defineEventHandler(async event => {
    await requireAuth(event);

    const body = await readBody(event);
    const currentUser = event.context.user;

    if (!currentUser) {
        return createApiError('Unauthorized', 401);
    }

    const validationResult = FlagWordSchema.safeParse(body);
    if (!validationResult.success) {
        throw createApiError('Invalid input', 400, validationResult.error);
    }

    const { wordId, reason, message } = validationResult.data;

    await prisma.flaggedWord.create({
        data: {
            wordId,
            reason: reason,
            message,
            reporterUserId: currentUser.userId,
        },
    });

    return sendApiDataResponse(event, { success: true }, 200);
});
