<template>
    <common-box>
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
    </common-box>
</template>

<script lang="ts" setup>
const publicV = ref(false);
const router = useRouter();
const games: Ref<number> = ref(4);
const rounds: Ref<number> = ref(4);
const maxPlayers: Ref<number> = ref(4);
const timeLimited = ref(false);
const timeLimit: Ref<number> = ref(0);
const membersCanAddWordLists = ref(false);
const membersCanAddCustomWordLists = ref(false);

interface Response {
    redirect?: string;
    message?: string;
}

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
    catch (e) {
        console.log(e);
    }
}
</script>
