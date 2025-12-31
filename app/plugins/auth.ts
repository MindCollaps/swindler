export default defineNuxtPlugin(nuxtApp => {
    const interval = 1000 * 60 * 20;

    if (import.meta.client) {
        setInterval(async () => {
            try {
                await $fetch('/api/v1/auth/refresh', { method: 'POST' });
            }
            catch {
                // Ignore errors
            }
        }, interval);
    }
});
