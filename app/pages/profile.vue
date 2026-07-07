<template>
    <common-page title="Profile">
        <div
            v-if="!ready"
            class="state state--loading"
            aria-busy="true"
            aria-live="polite"
        >
            <common-loader/>
        </div>

        <template v-else-if="store.me?.loggedIn">
            <p class="welcome">
                Welcome, <span class="welcome_name">{{ store.me?.username }}</span>!
            </p>

            <common-button
                :disabled="loggingOut"
                icon="material-symbols:logout"
                type="secondary"
                @click="handleLogout"
            >
                {{ loggingOut ? 'Signing out…' : 'Logout' }}
            </common-button>
        </template>

        <div
            v-else
            class="state"
        >
            <p>You're not signed in.</p>
            <common-button
                icon="material-symbols:login"
                to="/login"
            >
                Login
            </common-button>
        </div>
    </common-page>
</template>

<script setup lang="ts">
import { useStore } from '~/store';
import { ready } from '~/composables/layout';

const router = useRouter();
const store = useStore();
const loggingOut = ref(false);

// A bookmarked or stale /profile tab can still be reached after a session
// ends server-side; don't leave it showing stale user data.
watch(ready, isReady => {
    if (isReady && !store.me?.loggedIn) {
        router.replace('/login');
    }
}, { immediate: true });

function handleLogout() {
    if (loggingOut.value) return;
    loggingOut.value = true;

    // Full navigation on purpose: /logout is a plain server route that clears
    // the session cookie, not a client-routable page.
    window.location.assign('/logout');
}
</script>

<style scoped lang="scss">
.state {
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;

    min-height: 96px;

    &--loading {
        justify-content: center;
    }
}

.welcome {
    max-width: 60ch;
    text-align: center;
    overflow-wrap: anywhere;

    &_name {
        font-weight: 600;
        color: $primary400;
    }
}
</style>
