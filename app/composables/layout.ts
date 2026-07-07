import { useStore } from '~/store';
import { setupSocket } from '~/components/socket';

export const ready = computed(() => useStore().ready);

export const useLayout = () => {
    const store = useStore();

    // Theme handling
    const themeCookie = useCookie<ThemesList>('theme', {
        path: '/',
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 360,
    });

    // Reactive theme reference
    store.theme = themeCookie.value ?? 'default';

    setupSocket();

    useHead(() => {
        const theme = store.theme ?? 'default';
        const css = Object
            .entries({
                ...pageColors,
                ...(theme === 'default' ? {} : pageThemes[theme]),
            })
            .filter(([key]) => key.endsWith('Rgb'))
            .map(([key, value]) => `--${ key.replace('Rgb', '') }: ${ (value as number[]).join(',') }`)
            .join(';');

        return {
            titleTemplate(title) {
                if (!title) return 'Swindler';
                return `${ title } | Swindler`;
            },
            meta: [
                {
                    name: 'description',
                    content: 'A real-time social deduction game for friends. Everyone gets a secret word except one swindler faking it on one-word clues — give clues, vote, and catch the fake before they talk their way out.',
                },
                {
                    property: 'og:title',
                    content: 'Swindler',
                },
                {
                    property: 'og:description',
                    content: 'One player is faking the word. Give one-word clues, vote, and catch the swindler before the round ends.',
                },
                {
                    property: 'og:image',
                    content: '/resources/og-image.png',
                },
                {
                    property: 'og:image:width',
                    content: '1200',
                },
                {
                    property: 'og:image:height',
                    content: '630',
                },
                {
                    property: 'og:type',
                    content: 'website',
                },
                {
                    name: 'twitter:card',
                    content: 'summary_large_image',
                },
            ],
            htmlAttrs: {
                lang: 'en',
                class: [`theme-${ store.theme ?? 'default' }`],
            },
            style: [{
                key: 'pageStyles',
                innerHTML: `:root {${ css }}`,
            }],
        };
    });

    onNuxtReady(() => {
        setWindowStore();
        window.addEventListener('resize', setWindowStore);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', setWindowStore);
    });
};


function setWindowStore() {
    const store = useStore();
    store.isMobile = window.innerWidth < 700;
    store.isMobileOrTablet = window.innerWidth < 1466;
    store.isTablet = window.innerWidth < 1466 && window.innerWidth >= 700;
    store.isPC = window.innerWidth >= 1466;
    store.isPCWide = window.innerWidth >= 1900;
    store.scrollbarWidth = window.innerWidth - document.documentElement.offsetWidth;
    store.viewport.width = window.innerWidth;
}
