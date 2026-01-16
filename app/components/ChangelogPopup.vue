<template>
    <common-popup
        close-icon="material-symbols:close-rounded"
        close-text="Close"
        :is-visible="isVisible"
        submit-icon="material-symbols:check-rounded"
        submit-text="Awesome!"
        @close="close"
        @submit="close"
    >
        <div class="changelog-container">
            <div
                class="changelog-content"
                v-html="renderedMarkdown"
            />
        </div>
    </common-popup>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { useStorage } from '@vueuse/core';

const config = useRuntimeConfig();
const version = config.public.version as string;

const lastSeenVersion = useStorage('swindler-last-seen-version', '');

const isVisible = ref(false);
const markdown = ref('');
const md = new MarkdownIt();

// Custom plugin to handle {classname} in headers and wrap sections
md.core.ruler.push('header_class', (state: any) => {
    const tokens = state.tokens;
    const newTokens = [];
    let inDevelopSection = false;
    let developSectionLevel = 0;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'heading_open') {
            const level = parseInt(token.tag.slice(1));

            // Close existing section if new heading is same or higher level (h2 <= h2)
            if (inDevelopSection && level <= developSectionLevel) {
                const closeToken = new state.Token('div_close', 'div', -1);
                newTokens.push(closeToken);
                inDevelopSection = false;
            }

            // Check for {classname}
            let className = null;
            const inlineToken = tokens[i + 1];
            if (inlineToken && inlineToken.type === 'inline' && inlineToken.children) {
                const lastChild = inlineToken.children[inlineToken.children.length - 1];
                if (lastChild && lastChild.type === 'text') {
                    const match = lastChild.content.match(/ \{([a-zA-Z0-9_\-]+)\}$/);
                    if (match) {
                        className = match[1];
                        lastChild.content = lastChild.content.replace(match[0], '');
                        token.attrJoin('class', className);
                    }
                }
            }

            // If it's the develop section, open the container
            if (className === 'develop') {
                const openToken = new state.Token('div_open', 'div', 1);
                openToken.attrSet('class', 'develop-container');
                newTokens.push(openToken);

                inDevelopSection = true;
                developSectionLevel = level;
            }
        }

        newTokens.push(token);
    }

    // Close any open section at the end
    if (inDevelopSection) {
        const closeToken = new state.Token('div_close', 'div', -1);
        newTokens.push(closeToken);
    }

    state.tokens = newTokens;
});

const renderedMarkdown = computed(() => md.render(markdown.value));

onMounted(async () => {
    if (lastSeenVersion.value !== version) {
        try {
            const data = await $fetch<string>('/CHANGELOG.md');
            if (data) {
                markdown.value = data;
                isVisible.value = true;
            }
        }
        catch (e) {
            console.error('Failed to load changelog', e);
        }
    }
});

function close() {
    isVisible.value = false;
    lastSeenVersion.value = version;
}
</script>

<style scoped lang="scss">
.changelog-container {
    width: 100%;
    max-width: 600px;
}

.changelog-content {
    overflow-y: auto;
    max-height: 60vh;
    padding-right: 12px;
    color: white;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 4px;
        background: rgb(255 255 255 / 10%);
    }

    &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background: $primary400;
    }

    :deep(h1) {
        margin-bottom: 1.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid $primary400;

        font-size: 2rem;
        color: $primary400;
    }

    :deep(h2) {
        margin-top: 2rem;
        margin-bottom: 1rem;
        font-size: 1.5rem;
        color: $primary300;

        &.develop {
            font-size: 1.1rem;
            font-style: italic;
            color: $lightgray400;

            &::before {
                content: 'DEV';

                display: inline-block;

                margin-right: 8px;
                padding: 2px 6px;
                border-radius: 4px;

                font-size: 0.8rem;
                font-style: normal;
                line-height: 1;
                color: $lightgray300;
                vertical-align: middle;

                background-color: $darkgray800;
            }
        }
    }

    :deep(h3) {
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        font-size: 1.2rem;
        color: $primary300;
    }

    :deep(p) {
        margin-bottom: 1rem;
        line-height: 1.6;
        color: $lightgray300;
    }

    :deep(ul) {
        margin-bottom: 1.5rem;
        padding-left: 1.5rem;
        list-style-type: disc;
    }

    :deep(li) {
        margin-bottom: 0.5rem;
        line-height: 1.5;
        color: $lightgray300;

        &::marker {
            color: $primary400;
        }
    }

    :deep(a) {
        color: $primary400;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    :deep(.develop-container) {
        margin-top: 2rem;
        margin-bottom: 1rem;
        padding: 1rem;
        border: 1px solid $darkgray850;
        border-radius: 8px;

        background-color: $darkgray900;

        li {
            color: $lightgray400;

            &::marker {
                color: $lightgray300;
            }
        }

        h2.develop {
            margin-top: 0;
        }
    }
}
</style>
