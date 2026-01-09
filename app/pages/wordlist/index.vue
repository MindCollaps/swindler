

<template>
    <div>
        Wordlists
        <div class="wordlist">
            <div
                v-for="wordList in wordLists"
                :key="wordList.name"
                class="item"
            >
                {{ wordList.name }}
                <div class="actions">
                    <common-button @click="editWordlist(wordList.id)">Edit</common-button>
                    <common-button @click="deleteWordlist(wordList.id)">Delete</common-button>
                </div>
            </div>
        </div>

        <div class="input">
            <p>New Wordlist</p>
            <div>
                <common-input-text v-model="name">
                    Name
                </common-input-text>
            </div>

            <div>
                <common-input-text v-model="description">
                    Description
                </common-input-text>
            </div>

            <p>Words (one per line)</p>
            <div class="textfield">
                <textarea
                    v-model="words"
                    cols="40"
                    name="Words"
                    rows="5"
                />
            </div>

            <p>Access Settings</p>

            <div
                v-if="store.me?.admin"
                class="checkbox"
            >
                <common-checkbox
                    v-model="isCustom"
                    class="item"
                >Custom</common-checkbox>

                <common-checkbox
                    v-model="isDefault"
                    class="item"
                >Default</common-checkbox>
                <common-checkbox
                    v-model="isPublic"
                    class="item"
                >Public</common-checkbox>
            </div>

            <div
                v-else
                class="checkbox"
            >
                <common-checkbox
                    v-model="isPublic"
                    class="item"
                >Public</common-checkbox>
            </div>
        </div>

        <div class="input">
            <common-button @click="createWordlist">Create</common-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { FetchingWordList } from '~~/types/fetch';
import { useStore } from '~/store';

const store = useStore();

const router = useRouter();

const wordLists = ref<FetchingWordList[]>();

const name = ref<string>();
const description = ref<string>();
const isPublic = ref<boolean>(false);
const isCustom = ref<boolean>(false);
const isDefault = ref<boolean>(false);
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
                isDefault: isDefault.value,
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
    router.push(`/wordlist/${ id }`);
}

onMounted(() => {
    getWordlists();
});
</script>

<style lang="scss" scoped>
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

            .actions {
                display: flex;
                gap: 8px;
            }
        }
    }

    .input {
        display: flex;
        flex-direction: column;
        gap: 10px;

        padding: 10px;
        border-radius: 5px;

        .textfield {
            padding: 10px;
            border-radius: 4px;
        }

        .checkbox {
            display: flex;
            flex-direction: row;
            gap: 10px;
            justify-content: center;

            .item {
                margin-right: 5px;
                padding: 10px;
            }
        }
    }
</style>
