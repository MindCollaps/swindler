import { STATUS_CODES } from 'http';

export default defineEventHandler(event => {
    event.node.res.statusCode = 200;
    return { status: STATUS_CODES[200] };
});
