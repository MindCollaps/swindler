import { defineNitroPlugin } from 'nitropack/runtime';
import { createUser } from '~~/server/utils/user';

export default defineNitroPlugin(async nitroApp => {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const email = process.env.ADMIN_EMAIL;

    if (username && password && email) {
        try {
            const result = await createUser(username, email, password, true);

            if (result.success) {
                console.log(`Admin user '${ username }' created successfully.`);
            }
            else if (result.error === 'ALREADY_EXISTS') {
                console.log(`Admin user '${ username }' already exists.`);
            }
            else {
                console.error(`Failed to create admin user: ${ result.error }`);
            }
        }
        catch (error) {
            console.error(`Error creating admin user: ${ error.message }`);
        }
    }
    else {
        console.log('Admin user creation skipped. Missing ADMIN_USERNAME, ADMIN_PASSWORD, or ADMIN_EMAIL environment variables.');
    }
});
