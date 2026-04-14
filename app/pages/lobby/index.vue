<template>
    <common-box v-if="!selected">
        <common-button @click="createLobby = true; selected = true;">Create Lobby</common-button>
        <common-button @click="createLobby = false; selected = true;">Join Lobby</common-button>
    </common-box>
    <common-box v-else-if="!createLobby">
        <common-input-text
            v-model="lobbyCode"
            @keyup.enter="router.push(`/lobby/${ lobbyCode }`)"
        >
            Lobby Code
        </common-input-text>
        <common-button @click="router.push(`/lobby/${ lobbyCode }`)">
            Join
        </common-button>
    </common-box>
    <common-box v-else>
        <template v-if="store.me?.loggedIn">
            <!--
 <common-checkbox
            v-model="publicV"
            value="false"
        >Public</common-checkbox>
-->
            <common-input-number
                v-model="games"
                min="1"
            >Games</common-input-number>
            <common-input-number
                v-model="rounds"
                min="1"
            >Rounds</common-input-number>
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

            <common-button @click="create()">Create Lobby</common-button>
        </template>
        <create-fake-user v-if="!store.me?.loggedIn"/>
    </common-box>
</template>

<script lang="ts" setup>
import { useStore } from '~/store';
import { ToastMode } from '~~/types/toast';
import CreateFakeUser from '~/components/game/CreateFakeUser.vue';

const publicV = ref(false);
const router = useRouter();
const games: Ref<number> = ref(4);
const rounds: Ref<number> = ref(4);
const maxPlayers: Ref<number> = ref(4);
const timeLimited = ref(false);
const timeLimit: Ref<number> = ref(0);
const membersCanAddWordLists = ref(false);
const membersCanAddCustomWordLists = ref(false);
const createLobby = ref(false);
const selected = ref(false);
const lobbyCode = ref('');

const store = useStore();

interface Response {
    redirect?: string;
    message?: string;
}

const { showToast } = useToastManager();

async function create() {
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
        let message = error.data?.message || error.data?.statusMessage || error.statusMessage || 'Creation failed';

        if (Array.isArray(error.data?.data)) {
            message = error.data.data.map((i: any) => i.message).join('\n');
        }

        showToast({
            mode: ToastMode.Error,
            message,
            duration: 8000,
        });
    }
}
</script>
