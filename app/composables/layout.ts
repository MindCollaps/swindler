import { useStore } from '~/store';
import { useSocket } from '~/components/socket';

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
    store.setup();
    useSocket();

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
                    content: '',
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
};
