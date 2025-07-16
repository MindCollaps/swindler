export default defineNitroPlugin(nitroApp => {
    nitroApp.hooks.hook('error', async (error, { event }) => {
    // send error message，or you can standardize errors in here
    // send(event, error.message);

        const errorResponse = {
            error: true,
            statusCode: event?.node.res.statusCode ?? 500,
            message: error.message,
        };

        // log the full error to the backend server console
        console.log(error);

        if (event) {
            send(event, JSON.stringify(errorResponse), 'application/json');
        }
    });
});
