import { defineNitroPlugin } from 'nitropack/runtime';
import { createUser } from '../../server/utils/user';
import { initJWTSecret } from '../../server/utils/crypto/jwt';
import { createWordList } from '../../server/utils/wordlists';
import type { ImportWordListResult } from '../../server/utils/wordlists';
import { prisma } from '../../server/utils/prisma';
import fs from 'fs';
import path from 'path';


export default defineNitroPlugin(async nitroApp => {
    if (import.meta.dev) {
        console.warn('##############################################');
        console.warn(' THIS SERVER IS RUNNING IN DEVELOPMENT MODE');
        console.warn(' ==> MANY SECURITY FEATURES ARE DISABLED');
        console.warn(' !! NEVER USE THIS MODE IN PRODUCTION !!');
        console.warn('##############################################');
    }

    await initializeAdminUser();

    const jwtInitialized = await initJWTSecret();
    if (jwtInitialized) {
        console.log('JWT keys initialized successfully');
    }
    else {
        throw new Error('Failed to initialize JWT keys');
    }

    const result = await initializeWordlists();
    if (!result) {
        throw new Error('Wordlist initialization failed.');
    }
});

async function initializeAdminUser() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const email = process.env.ADMIN_EMAIL;

    if (username && password && email) {
        try {
            // disable the login for the admin user in prod
            // but allow it in development mode
            let disabled = true;
            if (import.meta.dev) {
                disabled = false;
            }
            else {
                disabled = true;
            }

            const result = await createUser(username, email, password, true, disabled);
            if (!result) {
                throw new Error('Failed to create the initial admin user');
            }

            if (result.success) {
                console.log(`Admin user '${ username }' created successfully.`);
            }
            else if (result.error === 'ALREADY_EXISTS') {
                console.log(`Admin user '${ username }' already exists.`);

                // make sure the admin user can login in development mode
                if (import.meta.dev) {
                    if (!result.user) {
                        throw new Error('Missing user data');
                    }

                    const success = await prisma.user.update({
                        where: { id: result.user.id },
                        data: { disabled: false },
                    });

                    if (success) {
                        console.log(`Admin user '${ username }' enabled for login in development mode.`);
                    }
                }
            }
            else {
                console.error(`Failed to create admin user: ${ result.error }`);
            }
        }
        catch (error: any) {
            console.error(`Error creating admin user: ${ error.message }`);
        }
    }
    else {
        console.log('Admin user creation skipped. Missing ADMIN_USERNAME, ADMIN_PASSWORD, or ADMIN_EMAIL environment variables.');
    }
}

async function initializeWordlists(): Promise<boolean> {
    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername) {
        console.warn('ADMIN_USERNAME environment variable is not set. Skipping wordlist initialization.');
        return false;
    }

    const adminUser = await prisma.user.findFirst({
        where: { username: adminUsername },
    });

    if (!adminUser) {
        console.warn(`Admin user "${ adminUsername }" not found. Skipping wordlist initialization.`);
        return false;
    }

    const directoryPath = path.resolve(process.cwd(), 'server/data/wordlists');
    let wordlistFiles: string[] = [];

    try {
        const files = fs.readdirSync(directoryPath);
        wordlistFiles = files.filter(file => file.endsWith('.txt'));
        console.log('Found wordlist files:', wordlistFiles);
    }
    catch (err) {
        console.error('Error reading directory:', err);
        return false;
    }

    for (const file of wordlistFiles) {
        console.log(`Importing wordlist from file: ${ file }`);
        const filePath = path.join(directoryPath, file);
        let wordlistName = path.basename(file, '.txt');

        // Make the first letter uppercase
        wordlistName = wordlistName.charAt(0).toUpperCase() + wordlistName.slice(1);

        const words = fs.readFileSync(filePath, 'utf-8')
            .split('\n')
            .map(word => word.trim())
            .filter(word => word.length > 0);

        const description = `This is the standard wordlist with the most common words in ${ wordlistName }`;

        const result: ImportWordListResult = await createWordList(
            wordlistName,
            description,
            words,
            adminUser.id,
            false, // Words may already exist but not the standard wordlist itself
            false,
            true, // default wordlists are public
            true, // default wordlist
        );

        if (!result.success) {
            // skip NO_NEW_WORDS --> handle as success for the initialization
            if (result.error == 'NO_WORDS' || result.error == 'GENERIC_ERROR' || result.error == 'DATABASE_ERROR') {
                console.error(`Failed to import ${ wordlistName }: ${ result.error }`);
                return false; // exit the import
            }

            if (result.error == 'ALREADY_EXISTS') {
                console.log(`Skipped existing wordlist ${ wordlistName }`);
            }
        }
        else {
            console.log(`Successfully imported ${ wordlistName }`);
        }
    }

    return true;
}
