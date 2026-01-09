<template>
    <div>
        <div v-if="wordlist">
            <h2>Name: {{ wordlist.name }}</h2>
            <p>Description:</p>

            <textarea
                v-model="description"
                cols="50"
                name="Description"
                rows="4"
            />

            <div v-if="store.me?.admin">
                <common-checkbox
                    v-model="isCustom"
                >Custom</common-checkbox>

                <common-checkbox
                    v-model="isDefault"
                >Default</common-checkbox>
                <common-checkbox
                    v-model="isPublic"
                >Public</common-checkbox>
            </div>

            <div v-else>
                <common-checkbox
                    v-model="isPublic"
                >Public</common-checkbox>
            </div>

            <div class="control-buttons">
                <p>Words</p>
                <common-input-text
                    v-model="newWord"
                    input-type="string"
                    @keyup.enter="addWord"
                />

                <common-button @click="addWord">Add new word</common-button>
                <common-button @click="updateWordlist(wordlist.id)">Save wordlist</common-button>
            </div>

            <div class="wordlist">
                <div
                    v-for="word in wordlist.words"
                    :key="word.id"
                    class="item"
                >
                    {{ word.word }} {{ word.id === -1 ? ' | Unsafed' : '' }}
                    <div class="buttons">
                        <common-button @click="deleteWord(word.word)">Delete</common-button>
                        <flag-word
                            v-if="word.id !== -1"
                            :word="word"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';
import type { FetchingWordListWithWords } from '~~/types/fetch';
import FlagWord from '~/components/word/FlagWord.vue';

interface Response {
    data?: FetchingWordListWithWords;
}

interface Word {
    id: number;
    word: string;
    saved?: boolean;
}

interface UpdateResponse {
    refresh: boolean;
}

const store = useStore();
const route = useRoute();
const wordlistId: string = route.params.id as string;

const wordlist = ref<FetchingWordListWithWords | null>(null);
const description = ref<string>('');
const newWord = ref<string>('');

const isPublic = ref<boolean>(false);
const isCustom = ref<boolean>(false);
const isDefault = ref<boolean>(false);

async function getWordlist(id: string) {
    try {
        const response = await $fetch<Response>(`/api/v1/wordlists/${ id }`);
        if (response.data) {
            wordlist.value = response.data;
            description.value = wordlist.value.description;

            // update the UI checkboxes
            isPublic.value = wordlist.value.public;
            isCustom.value = wordlist.value.custom;
            isDefault.value = wordlist.value.default;
        }
    }
    catch (e) {
        console.log(e);
    }
}

async function updateWordlist(id: number) {
    if (!wordlist.value) {
        return;
    }

    const payload = {
        description: description.value,
        isPublic: isPublic.value,
        isCustom: isCustom.value,
        isDefault: isDefault.value,
        words: wordlist.value.words.map(w => w.word),
    };

    const response = await $fetch<UpdateResponse>(`/api/v1/wordlists/${ id }`, {
        method: 'PUT',
        body: payload,
    });
    if (response.refresh) {
        getWordlist(wordlistId);
        // TODO: Make this cool with saved unsaved stuff and animations boom boom
        alert('updated');
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

    if (!wordlist.value.words.find(x => x.word.toLowerCase() == newWord.value.toLowerCase())) {
        const word: Word = {
            id: -1,
            word: newWord.value,
            saved: false,
        };
        wordlist.value.words.unshift(word);
    }
}

onMounted(() => {
    getWordlist(wordlistId);
});
</script>

<style scoped lang='scss'>
    .wordlist {
        display: flex;
        flex-direction: column;
        gap: 10px;

        margin-top: 10px;
        margin-bottom: 20px;
        padding: 10px;
        border-radius: 5px;

        .item {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin-bottom: 2px;
            padding: 8px;
            border-radius: 4px;

            background-color: $darkgray900;

            .buttons {
                display: flex;
                flex-direction: row;
                gap: 10px;
            }
        }
    }

    .control-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;

        padding: 10px;
        border-radius: 5px;
    }
</style>
