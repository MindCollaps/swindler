<template>
    <common-page title="Dashboard">
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
                Welcome back, <span class="welcome_name">{{ store.me.username }}</span>. Ready to deal you in?
            </p>

            <common-button
                icon="material-symbols:add-circle-rounded"
                to="/lobby"
            >
                Create Lobby
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

// A bookmarked or stale /dashboard tab can still be reached after a session
// ends server-side; don't leave it stuck on an empty page.
watch(ready, isReady => {
    if (isReady && !store.me?.loggedIn) {
        router.replace('/login');
    }
}, { immediate: true });
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
