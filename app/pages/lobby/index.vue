<template>
    <common-box v-if="!selected">
        <common-button @click="createLobby = true; selected = true;">Create Lobby</common-button>
        <common-button @click="createLobby = false; selected = true;">Join Lobby</common-button>
    </common-box>
    <common-box v-else-if="!createLobby">
        <common-input-text
            v-model="lobbyCode"
            :input-attrs="{ autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: 300 }"
            placeholder="Code or lobby link"
            @keyup.enter="joinLobby"
        >
            Lobby Code
        </common-input-text>
        <common-button
            :disabled="!lobbyCode.trim()"
            @click="joinLobby"
        >
            Join
        </common-button>
        <common-button
            class="back-action"
            type="transparent"
            @click="selected = false"
        >Back</common-button>
    </common-box>
    <common-box v-else>
        <div
            v-if="!ready"
            aria-busy="true"
            aria-live="polite"
            class="state state--loading"
        >
            <common-loader/>
        </div>
        <template v-else-if="store.me?.loggedIn">
            <div class="config-group">
                <div class="config-field">
                    <common-input-number
                        v-model="games"
                        :error="gamesError"
                        :input-attrs="{ min: 1, max: 10, step: 1, inputmode: 'numeric' }"
                        @input="gamesError = null"
                        @keyup.enter="create"
                    >Games</common-input-number>
                </div>
                <div class="config-field">
                    <common-input-number
                        v-model="rounds"
                        :error="roundsError"
                        :input-attrs="{ min: 1, max: 10, step: 1, inputmode: 'numeric' }"
                        @input="roundsError = null"
                        @keyup.enter="create"
                    >Rounds</common-input-number>
                </div>
            </div>

            <common-button
                :disabled="creating"
                @click="create()"
            >{{ creating ? 'Creating...' : 'Create Lobby' }}</common-button>
        </template>
        <create-fake-user v-else/>
        <common-button
            class="back-action"
            :disabled="creating"
            type="transparent"
            @click="selected = false"
        >Back</common-button>
    </common-box>
</template>

<script lang="ts" setup>
import { useStore } from '~/store';
import { ToastMode } from '~~/types/toast';
import CreateFakeUser from '~/components/game/CreateFakeUser.vue';
import { normalizeLobbyCode } from '~/utils/lobby-code';
import { ready } from '~/composables/layout';

const publicV = ref(false);
const router = useRouter();
const games: Ref<number | null> = ref(4);
const rounds: Ref<number | null> = ref(4);
const maxPlayers: Ref<number> = ref(4);
const timeLimited = ref(false);
const timeLimit: Ref<number> = ref(0);
const membersCanAddWordLists = ref(false);
const membersCanAddCustomWordLists = ref(false);
const createLobby = ref(false);
const selected = ref(false);
const lobbyCode = ref('');
const creating = ref(false);
const gamesError = ref<string | null>(null);
const roundsError = ref<string | null>(null);

const store = useStore();

interface Response {
    redirect?: string;
    message?: string;
}

const { showToast } = useToastManager();

let createController: AbortController | null = null;

// Leaving the create step (Back, or navigating away entirely) while the
// request is in flight would otherwise let a late response redirect the
// player somewhere they didn't ask to go.
onUnmounted(() => {
    createController?.abort();
});

function joinLobby() {
    const code = normalizeLobbyCode(lobbyCode.value);
    if (!code) {
        showToast({
            mode: ToastMode.Error,
            message: 'Enter a lobby code, or paste the lobby link a friend sent you',
            duration: 5000,
        });
        return;
    }
    router.push(`/lobby/${ code }`);
}

function validCount(value: number | null): boolean {
    return value !== null && Number.isInteger(value) && value >= 1 && value <= 10;
}

async function create() {
    if (creating.value) return;

    gamesError.value = validCount(games.value) ? null : 'Enter a whole number from 1 to 10';
    roundsError.value = validCount(rounds.value) ? null : 'Enter a whole number from 1 to 10';

    if (gamesError.value || roundsError.value) return;

    const payload = {
        public: publicV.value,
        games: games.value,
        rounds: rounds.value,
        maxPlayers: maxPlayers.value,
        timeLimited: timeLimited.value,
        timeLimit: timeLimit.value,
        membersCanAddWordLists: membersCanAddWordLists.value,
        membersCanAddCustomWordLists: membersCanAddCustomWordLists.value,
    };

    creating.value = true;
    createController = new AbortController();
    try {
        const response = await $fetch<Response>('/api/v1/lobby', {
            method: 'POST',
            body: payload,
            signal: createController.signal,
        });
        if (response.redirect) {
            router.push(response.redirect);
        }
    }
    catch (error: any) {
        // Aborted because the player left this step; nothing to report.
        if (createController.signal.aborted) return;

        let message = error.data?.message || error.data?.statusMessage || error.statusMessage || 'Could not create the lobby. Check your connection and try again.';

        if (Array.isArray(error.data?.data)) {
            message = error.data.data.map((i: any) => i.message).join('\n');
        }

        showToast({
            mode: ToastMode.Error,
            message,
            duration: 8000,
        });
    }
    finally {
        creating.value = false;
    }
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

.config-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.config-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.back-action {
    margin-top: 8px;
}
</style>
