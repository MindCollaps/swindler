<template>
    <common-box v-if="!selected">
        <common-button @click="createLobby = true; selected = true;">Create Lobby</common-button>
        <common-button @click="createLobby = false; selected = true;">Join Lobby</common-button>
    </common-box>
    <common-box v-else-if="!createLobby">
        <common-input-text
            v-model="lobbyCode"
            :input-attrs="{ autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }"
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
        <template v-if="store.me?.loggedIn">
            <!--
 <common-checkbox
            v-model="publicV"
            value="false"
        >Public</common-checkbox>
-->
            <div class="config-group">
                <common-input-number
                    v-model="games"
                    :input-attrs="{ min: 1, max: 20, step: 1, inputmode: 'numeric' }"
                >Games</common-input-number>
                <common-input-number
                    v-model="rounds"
                    :input-attrs="{ min: 1, max: 20, step: 1, inputmode: 'numeric' }"
                >Rounds</common-input-number>
            </div>
            <!--
 <common-input-number
            v-model="maxPlayers"
            min="1"
        >Max Players</common-input-number>
        <common-checkbox
            v-model="timeLimited"
            value="true"
        >Time Limited</common-checkbox>
        <common-input-number
            v-model="timeLimit"
            min="0"
        >Time Limit</common-input-number>
        <common-checkbox
            v-model="membersCanAddWordLists"
            value="true"
        >Members can add Wordlists</common-checkbox>
        <common-checkbox
            v-model="membersCanAddCustomWordLists"
            value="true"
        >Member can add custom Wordlists</common-checkbox>
-->

            <common-button
                :disabled="creating"
                @click="create()"
            >{{ creating ? 'Creating...' : 'Create Lobby' }}</common-button>
        </template>
        <create-fake-user v-if="!store.me?.loggedIn"/>
        <common-button
            class="back-action"
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

const store = useStore();

interface Response {
    redirect?: string;
    message?: string;
}

const { showToast } = useToastManager();

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
    return value !== null && Number.isInteger(value) && value >= 1 && value <= 20;
}

async function create() {
    if (creating.value) return;

    if (!validCount(games.value) || !validCount(rounds.value)) {
        showToast({
            mode: ToastMode.Error,
            message: 'Games and rounds must each be a whole number from 1 to 20',
            duration: 5000,
        });
        return;
    }

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
    try {
        const response = await $fetch<Response>('/api/v1/lobby', {
            method: 'POST',
            body: payload,
        });
        if (response.redirect) {
            router.push(response.redirect);
        }
    }
    catch (error: any) {
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
.config-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.back-action {
    margin-top: 8px;
}
</style>
