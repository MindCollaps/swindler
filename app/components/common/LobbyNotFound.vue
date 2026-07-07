<template>
    <common-box>
        <h1>Lobby not found</h1>
        <p>This lobby does not exist. It may have ended, or the code has a typo.</p>
        <common-input-text
            v-model="lobbyCode"
            :input-attrs="{ autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: 300 }"
            placeholder="Code or lobby link"
            @keyup.enter="joinOther"
        >
            Lobby Code
        </common-input-text>
        <common-button
            :disabled="!lobbyCode.trim()"
            @click="joinOther"
        >
            Join
        </common-button>
        <common-button @click="router.push('/lobby')">
            Create Lobby
        </common-button>
    </common-box>
</template>

<script setup lang="ts">
import { ToastMode } from '~~/types/toast';
import { normalizeLobbyCode } from '~/utils/lobby-code';

const lobbyCode = ref('');
const router = useRouter();
const { showToast } = useToastManager();

function joinOther() {
    const code = normalizeLobbyCode(lobbyCode.value);
    if (!code) {
        showToast({
            mode: ToastMode.Error,
            message: 'Enter a lobby code, or paste the lobby link a friend sent you',
            duration: 5000,
        });
        return;
    }
    // Full navigation on purpose: this page's socket state is keyed to the
    // dead lobby id, and a soft route change would reuse it.
    window.location.assign(`/lobby/${ code }`);
}
</script>

<style scoped lang="scss">
h1 {
    font-size: 2rem;
    color: $error500;
}
</style>
