import { defineNitroPlugin } from 'nitropack/runtime';

export default defineNitroPlugin(nitroApp => {
    const jwtInitialized = initJWT();

    if (jwtInitialized) {
        console.log('JWT keys initialized successfully');
    }
    else {
        console.error('Failed to initialize JWT keys');
    }
});
