<template>
    <common-box>
        <common-input-text
            ref="usernameInputRef"
            v-model="username"
            :disabled="isSubmitting"
            :error="errors.username"
            :input-attrs="{ autocomplete: 'username', autocapitalize: 'none', maxlength: 32, spellcheck: false }"
            @input="errors.username = null"
            @keyup.enter="signup"
        >Username</common-input-text>
        <common-input-text
            ref="emailInputRef"
            v-model="email"
            :disabled="isSubmitting"
            :error="errors.email"
            :input-attrs="{ autocomplete: 'email', inputmode: 'email', maxlength: 254 }"
            input-type="email"
            @input="errors.email = null"
            @keyup.enter="signup"
        >E-Mail</common-input-text>
        <common-input-text
            ref="passwordInputRef"
            v-model="password"
            :disabled="isSubmitting"
            :error="errors.password"
            :input-attrs="{ autocomplete: 'new-password', maxlength: 64 }"
            input-type="password"
            show-password-toggle
            @input="errors.password = null"
            @keyup.enter="signup"
        >Password</common-input-text>
        <common-input-text
            ref="passwordreInputRef"
            v-model="passwordre"
            :disabled="isSubmitting"
            :error="errors.passwordre"
            :input-attrs="{ autocomplete: 'new-password', maxlength: 64 }"
            input-type="password"
            show-password-toggle
            @input="errors.passwordre = null"
            @keyup.enter="signup"
        >Repeat Password</common-input-text>
        <common-button
            :aria-busy="isSubmitting"
            :disabled="isSubmitting"
            @click="signup"
        >{{ isSubmitting ? 'Creating account…' : 'Signup' }}</common-button>
    </common-box>
</template>

<script setup lang="ts">
import { socket } from '~/components/socket';
import { useToastManager } from '~/composables/toastManager';
import { ToastMode } from '~~/types/toast';
import { useStore } from '~/store';
import { ready } from '~/composables/layout';

const router = useRouter();
const store = useStore();
const { showToast } = useToastManager();

const username = ref<string>();
const password = ref<string>();
const passwordre = ref<string>();
const email = ref<string>();

const isSubmitting = ref(false);

const errors = reactive<{
    username: string | null;
    email: string | null;
    password: string | null;
    passwordre: string | null;
}>({
    username: null,
    email: null,
    password: null,
    passwordre: null,
});

const usernameInputRef = ref<{ input: HTMLInputElement | null } | null>(null);
const emailInputRef = ref<{ input: HTMLInputElement | null } | null>(null);
const passwordInputRef = ref<{ input: HTMLInputElement | null } | null>(null);
const passwordreInputRef = ref<{ input: HTMLInputElement | null } | null>(null);

interface SignupResponse {
    redirect?: string;
    message?: string;
}

// A bookmarked or stale /signup tab can still be reached while a session is already active.
watch(ready, isReady => {
    if (isReady && store.me?.loggedIn) {
        router.replace('/dashboard');
    }
}, { immediate: true });

// Mirrors server/utils/backend/validation.ts signupSchema; keep both in sync.
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function validateUsername(value?: string): string | null {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return 'Username is required';
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    if (trimmed.length > 32) return 'Username must not exceed 32 characters';
    return null;
}

function validateEmail(value?: string): string | null {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return 'Email is required';
    if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address';
    return null;
}

function validatePassword(value?: string): string | null {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (value.length > 64) return 'Password must not exceed 64 characters';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return null;
}

function validatePasswordRepeat(value?: string, comparesTo?: string): string | null {
    const baseError = validatePassword(value);
    if (baseError) return baseError;
    if (value !== comparesTo) return 'Passwords do not match';
    return null;
}

watch(password, () => {
    if (errors.passwordre) errors.passwordre = validatePasswordRepeat(passwordre.value, password.value);
});

function focusFirstError() {
    if (errors.username) usernameInputRef.value?.input?.focus();
    else if (errors.email) emailInputRef.value?.input?.focus();
    else if (errors.password) passwordInputRef.value?.input?.focus();
    else if (errors.passwordre) passwordreInputRef.value?.input?.focus();
}

async function signup() {
    if (isSubmitting.value) return;

    errors.username = validateUsername(username.value);
    errors.email = validateEmail(email.value);
    errors.password = validatePassword(password.value);
    errors.passwordre = validatePasswordRepeat(passwordre.value, password.value);

    if (errors.username || errors.email || errors.password || errors.passwordre) {
        focusFirstError();
        return;
    }

    isSubmitting.value = true;
    try {
        const response = await $fetch<SignupResponse>('/api/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                username: username.value?.trim(),
                password: password.value,
                passwordRepeated: passwordre.value,
                email: email.value?.trim().toLowerCase(),
            }),
        });
        if (response.redirect) {
            socket.disconnect();
            socket.connect();

            socket.emit('me');
            await router.push(response.redirect);
        }
    }
    catch (error: any) {
        let message = 'Signup failed. Please try again.';

        if (error?.data) {
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
            duration: 8000,
        });
    }
    finally {
        isSubmitting.value = false;
    }
}
</script>
