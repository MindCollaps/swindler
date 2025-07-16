export function createApiError(message: string, statusCode: number = 500, data?: any) {
    return createError({
        statusCode,
        statusMessage: message,
        data: data,
    });
}

export function sendApiResponse(event: any, message: string, statusCode: number = 500) {
    event.node.res.statusCode = statusCode;

    let response = {
        message: message,
    };

    // https://de.wikipedia.org/wiki/HTTP-Statuscode
    const error = (statusCode >= 400 && statusCode <= 511);

    if (error) {
        response = { ...{ error: true }, ...response };
    }

    return response;
}

export function sendApiDataResponse(event: any, data: any, statusCode: number = 200) {
    event.node.res.statusCode = statusCode;

    let response = {
        data: data,
    };

    // https://de.wikipedia.org/wiki/HTTP-Statuscode
    const error = (statusCode >= 400 && statusCode <= 511);

    if (error) {
        response = { ...{ error: true }, ...response };
    }

    return response;
}
