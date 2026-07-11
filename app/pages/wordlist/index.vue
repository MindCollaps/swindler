

<template>
    <common-page title="Wordlists">
        <div class="wordlist">
            <common-loader
                v-if="loadingWordlists"
                smol
            />
            <div
                v-for="wordList in wordLists"
                :key="wordList.id"
                class="item"
            >
                {{ wordList.name }}
                <div class="actions">
                    <common-button
                        :disabled="creating || deletingWordlistId === wordList.id"
                        @click="editWordlist(wordList.id)"
                    >Edit</common-button>
                    <common-button
                        :disabled="creating || deletingWordlistId === wordList.id"
                        @click="deleteWordlist(wordList.id)"
                    >{{ deletingWordlistId === wordList.id ? 'Deleting...' : 'Delete' }}</common-button>
                </div>
            </div>

            <p
                v-if="!loadingWordlists && (!wordLists || wordLists.length === 0)"
                class="empty"
            >No wordlists yet. Create one below to get started.</p>
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
                    aria-label="Words"
                    cols="40"
                    name="Words"
                    placeholder="apple\nbanana\npear"
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
            <common-button
                :disabled="creating || deletingWordlistId !== null || !canCreateWordlist"
                @click="createWordlist"
            >{{ creating ? 'Creating...' : 'Create' }}</common-button>
        </div>
    </common-page>
</template>

<script lang="ts" setup>
import type { FetchingWordList } from '~~/types/fetch';
import { useStore } from '~/store';
import { ToastMode } from '~~/types/toast';

const store = useStore();
const router = useRouter();
const { showToast } = useToastManager();

const wordLists = ref<FetchingWordList[]>();

const name = ref<string>();
const description = ref<string>();
const isPublic = ref<boolean>(false);
const isCustom = ref<boolean>(false);
const isDefault = ref<boolean>(false);
const words = ref<string>();

interface Response {
    data?: FetchingWordList[];
    message?: string;
}

const loadingWordlists = ref(false);
const creating = ref(false);
const deletingWordlistId = ref<number | null>(null);

const canCreateWordlist = computed(() => {
    const hasName = Boolean(name.value?.trim());
    const hasDescription = Boolean(description.value?.trim());
    const hasWords = words.value?.split('\n').map(word => word.trim()).filter(Boolean).length;
    return hasName && hasDescription && Boolean(hasWords);
});

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
        const maybe = error as {
            data?: { message?: string; statusMessage?: string };
            statusMessage?: string;
            message?: string;
        };
        return maybe.data?.message || maybe.data?.statusMessage || maybe.statusMessage || maybe.message || fallback;
    }

    return fallback;
}

function resetCreateForm() {
    name.value = '';
    description.value = '';
    words.value = '';
    isPublic.value = false;
    isCustom.value = false;
    isDefault.value = false;
}

async function getWordlists() {
    loadingWordlists.value = true;
    try {
        const response = await $fetch<Response>('/api/v1/wordlists', {
            method: 'GET',
        });
        if (response.data) {
            wordLists.value = response.data;
        }
    }
    catch (e) {
        showToast({
            mode: ToastMode.Error,
            message: getApiErrorMessage(e, 'Failed to load wordlists. Please try again.'),
        });
    }
    finally {
        loadingWordlists.value = false;
    }
}

async function createWordlist() {
    if (creating.value) return;

    try {
        if (!name.value) {
            showToast({
                mode: ToastMode.Error,
                message: 'Enter a wordlist name.',
            });

            return;
        }

        if (!description.value) {
            showToast({
                mode: ToastMode.Error,
                message: 'Enter a wordlist description.',
            });

            return;
        }

        if (store.me?.admin && !isCustom.value && !isPublic.value && !isDefault.value) {
            showToast({
                mode: ToastMode.Error,
                message: 'Select at least one access mode.',
            });

            return;
        }

        const wordArray = words.value?.split('\n').map(word => word.trim()).filter(Boolean);
        if (!wordArray || wordArray.length < 1) {
            showToast({
                mode: ToastMode.Error,
                message: 'Add at least one word to the wordlist.',
            });

            return;
        }

        creating.value = true;

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
            showToast({
                mode: ToastMode.Success,
                message: 'Wordlist created.',
            });

            resetCreateForm();
            await getWordlists();
        }
        else {
            showToast({
                mode: ToastMode.Error,
                message: getApiErrorMessage(result._data, result.statusText),
            });
        }
    }
    catch (e) {
        showToast({
            mode: ToastMode.Error,
            message: getApiErrorMessage(e, 'Failed to create the wordlist. Please try again.'),
        });
    }
    finally {
        creating.value = false;
    }
}

async function deleteWordlist(id: number) {
    if (deletingWordlistId.value !== null) return;

    try {
        deletingWordlistId.value = id;
        const result = await $fetch.raw(`/api/v1/wordlists/${ id }`, {
            method: 'DELETE',
        });

        if (result.ok) {
            showToast({
                mode: ToastMode.Success,
                message: 'Wordlist deleted.',
            });

            await getWordlists();
        }
        else {
            showToast({
                mode: ToastMode.Error,
                message: getApiErrorMessage(result._data, 'Failed to delete the wordlist. Please try again.'),
            });
        }
    }
    catch (e) {
        showToast({
            mode: ToastMode.Error,
            message: getApiErrorMessage(e, 'Failed to delete the wordlist. Please try again.'),
        });
    }
    finally {
        deletingWordlistId.value = null;
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
        border-radius: 8px;

        .empty {
            color: $lightgray150;
        }

        .item {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin-bottom: 2px;
            padding: 8px;
            border-radius: 8px;

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
        border-radius: 8px;

        .textfield {
            padding: 10px;
            border-radius: 8px;

            textarea {
                width: 100%;
                border: 2px solid transparent;
                border-radius: 8px;
                padding: 10px 12px;
                color: $lightgray50;
                background: $darkgray900;
                resize: vertical;
            }

            textarea:focus {
                outline: none;
                border-color: $primary500;
            }
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
