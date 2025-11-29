

<template>
    <div>
        Wordlists
        <div>
            <div
                v-for="wordList in wordLists"
                :key="wordList.name"
                style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 2px;"
            >
                {{ wordList.name }}
                <div>
                    <common-button @click="deleteWordlist(wordList.id)">Delete</common-button>
                    <common-button @click="editWordlist(wordList.id)">Edit</common-button>
                </div>
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

        <div>
            <common-input-text
                v-model="description"
                input-type="string"
            >
                Description
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

        <div>
            <textarea
                v-model="words"
                cols="40"
                name="Words"
                rows="5"
            />
        </div>

        <div>
            <common-button @click="createWordlist">Create</common-button>
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
const description = ref<string>();
const isPublic = ref<boolean>(false);
const isCustom = ref<boolean>(false);
const isSystem = ref<boolean>(false);
const words = ref<string>();

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

async function createWordlist() {
    try {
        const wordArray = words.value?.split('\n');
        console.log(wordArray);

        const result = await $fetch.raw('/api/v1/wordlists', {
            method: 'POST',
            body: JSON.stringify({
                name: name.value,
                description: description.value,
                words: wordArray,
                isCustom: isCustom.value,
                isPublic: isPublic.value,
                isSystem: isSystem.value,
            }),
        });
        if (result.ok) {
            alert('Success!');
        }
        else {
            alert(result.statusText);
        }
    }
    catch (e) {
        console.log(e);
        alert(e);
    }
}

async function deleteWordlist(id: number) {
    try {
        const result = await $fetch.raw(`/api/v1/wordlists/${ id }`, {
            method: 'DELETE',
        });

        if (result.ok) {
            alert('Success!');
        }
        else {
            alert(result.statusText);
        }
    }
    catch (e) {
        console.log(e);
        alert(e);
    }
}

async function editWordlist(id: number) {
    window.location.href = `/wordlist/${ id }`;
}

onMounted(() => {
    getWordlists();
});
</script>
