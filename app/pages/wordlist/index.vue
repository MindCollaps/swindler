

<template>
    <div>
        Wordlists
        <div>
            <div
                v-for="wordList in wordLists"
                :key="wordList.name"
            >
                {{ wordList.name }}
            </div>
        </div>

        <div>
            <common-input-text
                v-model="name"
                input-type="string"
            >
                Name
            </common-input-text>
        </div>

        <div v-if="isAdmin">
            <common-checkbox
                v-model="isCustom"
                value="false"
            >Custom</common-checkbox>

            <common-checkbox
                v-model="isSystem"
                value="false"
            >Default</common-checkbox>
            <common-checkbox
                v-model="isPublic"
                value="false"
            >Public</common-checkbox>
        </div>

        <div v-else>
            <common-checkbox
                v-model="isPublic"
                value="false"
            >Public</common-checkbox>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { FetchingWordList } from '~~/types/fetch';
import { useStore } from '~/store';

const store = await useStore();

const isAdmin = computed(() => store.me?.admin);

const wordLists = ref<FetchingWordList[]>();

const name = ref<string>();
// const description = ref<string>();
const isPublic = ref<boolean>(false);
const isCustom = ref<boolean>(false);
const isSystem = ref<boolean>(false);

interface Response {
    data?: FetchingWordList[];
}

async function getWordlists() {
    try {
        const response = await $fetch<Response>('/api/v1/wordlists', {
            method: 'GET',
        });
        if (response.data) {
            wordLists.value = response.data;
        }
    }
    catch (e) {
        console.log(e);
    }
}

onMounted(() => {
    getWordlists();
});
</script>
