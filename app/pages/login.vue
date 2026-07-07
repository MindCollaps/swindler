<template>
    <form
        novalidate
        @submit.prevent="login"
    >
        <common-box>
            <common-input-text
                ref="usernameInputRef"
                v-model="username"
                :disabled="isSubmitting"
                :error="errors.username"
                :input-attrs="{ autocomplete: 'username', autocapitalize: 'none', maxlength: 32, spellcheck: false }"
                @input="errors.username = null"
                @keyup.enter="login"
            >Username</common-input-text>
            <common-input-text
                ref="passwordInputRef"
                v-model="password"
                :disabled="isSubmitting"
                :error="errors.password"
                :input-attrs="{ autocomplete: 'current-password', maxlength: 64 }"
                input-type="password"
                show-password-toggle
                @input="errors.password = null"
                @keyup.enter="login"
            >Password</common-input-text>
            <common-button
                :aria-busy="isSubmitting"
                :disabled="isSubmitting"
                @click="login"
            >{{ isSubmitting ? 'Logging in…' : 'Login' }}</common-button>
        </common-box>
    </form>
</template>

<script setup lang="ts">
import { socket } from '~/components/socket';
import { ToastMode } from '~~/types/toast';
import { useToastManager } from '~/composables/toastManager';
import { useStore } from '~/store';
import { ready } from '~/composables/layout';

const { showToast } = useToastManager();

const router = useRouter();
const store = useStore();
const username = ref<string>();
const password = ref<string>();

const isSubmitting = ref(false);

const errors = reactive<{
    username: string | null;
    password: string | null;
}>({
    username: null,
    password: null,
});

const usernameInputRef = ref<{ input: HTMLInputElement | null } | null>(null);
const passwordInputRef = ref<{ input: HTMLInputElement | null } | null>(null);

interface LoginResponse {
    redirect?: string;
    message?: string;
}

// Mirrors server/utils/backend/validation.ts loginSchema; keep both in sync.
function validateUsername(value?: string): string | null {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return 'Username is required';
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    if (trimmed.length > 32) return 'Username must not exceed 32 characters';
    return null;
}

function validatePassword(value?: string): string | null {
    if (!value) return 'Password is required';
    if (value.length < 3) return 'Password must be at least 3 characters';
    if (value.length > 64) return 'Password must not exceed 64 characters';
    return null;
}

function focusFirstError() {
    if (errors.username) usernameInputRef.value?.input?.focus();
    else if (errors.password) passwordInputRef.value?.input?.focus();
}

// A bookmarked or stale /login tab can still be reached while a session is already active.
watch(ready, isReady => {
    if (isReady && store.me?.loggedIn) {
        router.replace('/dashboard');
    }
}, { immediate: true });

async function login() {
    if (isSubmitting.value) return;

    errors.username = validateUsername(username.value);
    errors.password = validatePassword(password.value);

    if (errors.username || errors.password) {
        focusFirstError();
        return;
    }

    isSubmitting.value = true;
    try {
        const response = await $fetch<LoginResponse>('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username: username.value?.trim(),
                password: password.value,
            }),
        });
        if (response.redirect) {
            // Auth cookie in socket
            socket.disconnect();
            socket.connect();

            socket.emit('me');
            await router.push(response.redirect);
        }
    }
    catch (error: any) {
        let message = 'Login failed. Please try again.';
        let status: number | undefined;

        if (error?.data) {
            status = error.statusCode;
            message = error.data?.message || error.data?.statusMessage || error.statusMessage || message;

            if (Array.isArray(error.data?.data)) {
                message = error.data.data.map((i: any) => i.message).join('\n');
            }
        }
        else if (!error?.statusCode) {
            message = 'Could not reach the server. Check your connection and try again.';
        }

        showToast({
            mode: ToastMode.Error,
            message,
            duration: status === 429 ? 10000 : 8000,
        });
    }
    finally {
        isSubmitting.value = false;
    }
}
</script>
