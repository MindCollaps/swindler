<template>
    <div>
        <div v-if="wordlist">
            <h2>Name: {{ wordlist.name }}</h2>
            <p>Description</p>

            <textarea v-model="description" cols="50" name="Description" rows="4" />

            <p>Words</p>
            <common-input-text v-model="newWord" input-type="string" @keyup.enter="addWord" />
            <common-button @click="addWord">Add new word</common-button>

            <div v-for="word in wordlist.words" :key="word.id"
                style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 2px;">
                {{ word.word }} {{ word.id == -1 ? ' | Unsafed' : '' }}
                <common-button @click="deleteWord(word.word)">Delete</common-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { FetchingWordListWithWords } from '~~/types/fetch';

interface Response {
    data?: FetchingWordListWithWords;
}

interface Word {
    id: number;
    word: string;
    isCustom: boolean | null;
}

const route = useRoute();
const wordlistId: string = route.params.id as string;

const wordlist = ref<FetchingWordListWithWords | null>(null);
const description = ref<string>('');
const newWord = ref<string>('');

async function getWordlist(id: string) {
    try {
        const response = await $fetch<Response>(`/api/v1/wordlists/${id}`);
        if (response.data) {
            wordlist.value = response.data;
            description.value = wordlist.value.description;
        }
    }
    catch (e) {
        console.log(e);
    }
}

async function deleteWord(word: string) {
    if (!wordlist.value) {
        return;
    }

    wordlist.value.words = wordlist.value.words.filter(w => w.word !== word);
}

async function addWord() {
    if (!newWord.value || !wordlist.value || !newWord.value) {
        return;
    }

    if (!wordlist.value.words.find(x => x.word == newWord.value)) {
        const word: Word = {
            id: -1,
            word: newWord.value,
            isCustom: true,
        };
        wordlist.value.words.unshift(word);
    }
}

onMounted(() => {
    getWordlist(wordlistId);
});
</script>
