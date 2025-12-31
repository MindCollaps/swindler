export default defineNuxtPlugin(nuxtApp => {
    const TOKEN_REFRESH_INTERVAL_MS = 1000 * 60 * 20;

    if (import.meta.client) {
        setInterval(async () => {
            try {
                await $fetch('/api/v1/auth/refresh', { method: 'POST' });
            }
            catch (error) {
                console.error('Failed to refresh token:', error);
            }
        }, TOKEN_REFRESH_INTERVAL_MS);
    }
});
