<template>
    <div class="error-page">
        <p class="error-page_code">{{ error.statusCode }}</p>
        <h1 class="error-page_title">{{ title }}</h1>
        <p class="error-page_message">{{ message }}</p>
        <common-button @click="handleError">Back to the table</common-button>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { NuxtError } from '#app';

const props = defineProps({
    error: {
        type: Object as PropType<NuxtError>,
        required: true,
    },
});

const title = computed(() => props.error.statusCode === 404 ? 'This hand doesn\'t exist' : 'Something folded');
const message = computed(() => props.error.statusCode === 404
    ? 'The page you\'re looking for isn\'t on the table.'
    : 'The table hit a snag. Try again in a moment.');

function handleError() {
    clearError({ redirect: '/' });
}
</script>

<style scoped lang="scss">
.error-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;

    min-height: 100dvh;
    padding: 32px;

    text-align: center;

    &_code {
        margin: 0;
        font-size: 4rem;
        font-weight: 600;
        color: $darkgray600;
    }

    &_title {
        margin: 0;
        font-size: 1.5rem;
    }

    &_message {
        max-width: 40ch;
        margin: 0;
        color: $lightgray400;
    }
}
</style>
