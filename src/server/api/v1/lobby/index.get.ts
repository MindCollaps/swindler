import { checkUserSession } from '~/server/utils';
import { serverData } from '~/utils/data';
import { z } from 'zod';
import { convertLobby } from '~/server/utils/convert';

const QuerySchema = z.object({
    id: z.string(),
});


export default defineEventHandler(async event => {
    if (!await checkUserSession(event)) return;

    const query = await getValidatedQuery(event, query => QuerySchema.safeParse(query));
    if (!query.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Request invalid!',
        });
    }
    const token = query.data?.id

    const fLobby = serverData.lobbies.find(x => x.token === token);

    if (fLobby) {
        return convertLobby(fLobby);
    }
});
