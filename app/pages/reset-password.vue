<template>
    <common-page :title="hasToken ? 'Set New Password' : 'Reset Password'">
        <common-box>
            <p v-if="!hasToken">Enter your account email and we will send you a reset link.</p>
            <p v-else>Choose a new password for your account.</p>

            <template v-if="!hasToken">
                <common-input-text
                    ref="emailInputRef"
                    v-model="email"
                    :disabled="isSubmitting"
                    :error="errors.email"
                    :input-attrs="{ autocomplete: 'email', inputmode: 'email', maxlength: 254 }"
                    input-type="email"
                    @input="errors.email = null"
                    @keyup.enter="requestReset"
                >E-Mail</common-input-text>
                <common-button
                    :aria-busy="isSubmitting"
                    :disabled="isSubmitting"
                    @click="requestReset"
                >{{ isSubmitting ? 'Sending…' : 'Send reset link' }}</common-button>
            </template>

            <template v-else>
                <common-input-text
                    ref="passwordInputRef"
                    v-model="password"
                    :disabled="isSubmitting"
                    :error="errors.password"
                    :input-attrs="{ autocomplete: 'new-password', maxlength: 64 }"
                    input-type="password"
                    show-password-toggle
                    @input="errors.password = null"
                    @keyup.enter="confirmReset"
                >Password</common-input-text>
                <common-input-text
                    ref="passwordRepeatInputRef"
                    v-model="passwordRepeat"
                    :disabled="isSubmitting"
                    :error="errors.passwordRepeat"
                    :input-attrs="{ autocomplete: 'new-password', maxlength: 64 }"
                    input-type="password"
                    show-password-toggle
                    @input="errors.passwordRepeat = null"
                    @keyup.enter="confirmReset"
                >Repeat Password</common-input-text>
                <common-button
                    :aria-busy="isSubmitting"
                    :disabled="isSubmitting"
                    @click="confirmReset"
                >{{ isSubmitting ? 'Updating…' : 'Update password' }}</common-button>
            </template>

            <common-button
                :disabled="isSubmitting"
                to="/login"
                type="link"
            >Back to login</common-button>
        </common-box>
    </common-page>
</template>

<script setup lang="ts">
import { useToastManager } from '~/composables/toastManager';
import { ToastMode } from '~~/types/toast';

const route = useRoute();
const router = useRouter();
const { showToast } = useToastManager();

const email = ref('');
const password = ref('');
const passwordRepeat = ref('');
const isSubmitting = ref(false);

const emailInputRef = ref<{ input: HTMLInputElement | null } | null>(null);
const passwordInputRef = ref<{ input: HTMLInputElement | null } | null>(null);
const passwordRepeatInputRef = ref<{ input: HTMLInputElement | null } | null>(null);

const errors = reactive<{
    email: string | null;
    password: string | null;
    passwordRepeat: string | null;
}>({
    email: null,
    password: null,
    passwordRepeat: null,
});

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const token = computed(() => {
    const tokenQuery = route.query.token;
    if (Array.isArray(tokenQuery)) return tokenQuery[0] ?? '';
    return typeof tokenQuery === 'string' ? tokenQuery : '';
});

const hasToken = computed(() => Boolean(token.value));

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

async function requestReset() {
    if (isSubmitting.value) return;

    errors.email = validateEmail(email.value);
    if (errors.email) {
        emailInputRef.value?.input?.focus();
        return;
    }

    isSubmitting.value = true;
    try {
        const response = await $fetch<{ message?: string }>('/api/v1/auth/reset/request', {
            method: 'POST',
            body: {
                email: email.value.trim().toLowerCase(),
            },
        });

        showToast({
            mode: ToastMode.Success,
            message: response.message || 'If an account exists, we sent a reset link.',
            duration: 7000,
        });
    }
    catch (error: any) {
        const message = error?.data?.message || error?.statusMessage || 'Failed to request password reset.';
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

async function confirmReset() {
    if (isSubmitting.value) return;

    errors.password = validatePassword(password.value);
    errors.passwordRepeat = validatePasswordRepeat(passwordRepeat.value, password.value);

    if (errors.password || errors.passwordRepeat) {
        if (errors.password) {
            passwordInputRef.value?.input?.focus();
        }
        else {
            passwordRepeatInputRef.value?.input?.focus();
        }
        return;
    }

    if (!token.value) {
        showToast({
            mode: ToastMode.Error,
            message: 'Reset token is missing.',
        });
        return;
    }

    isSubmitting.value = true;
    try {
        const response = await $fetch<{ message?: string }>('/api/v1/auth/reset/confirm', {
            method: 'POST',
            body: {
                token: token.value,
                password: password.value,
                passwordRepeated: passwordRepeat.value,
            },
        });

        showToast({
            mode: ToastMode.Success,
            message: response.message || 'Password updated successfully.',
            duration: 7000,
        });

        await router.push('/login');
    }
    catch (error: any) {
        const message = error?.data?.message || error?.statusMessage || 'Failed to update password.';
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
