export interface HeaderItem {
    text: string;
    active?: boolean;
    action?: () => void;
    path?: string;
    disabled?: boolean;
    hide?: boolean;
    width?: string;
    icon?: string;
    children?: Omit<HeaderItem, 'children' | 'minWidth'>[];
}

export const useHeaderMenu = () => computed<HeaderItem[]>(() => {
    const route = useRoute();
    const { loggedIn } = useUserSession();

    const menu: HeaderItem[] = [
        {
            text: 'Home',
            path: '/',
            icon: 'material-symbols:other-houses',
        },
        {
            text: 'Dashboard',
            path: '/dashboard',
            hide: !loggedIn.value,
        },
    ];

    return menu.filter(x => !x.hide).map(x => {
        return {
            ...x,
            active: x.active ?? (x.path === route.path || !!x.children?.some(x => x.path === route.path)),
            children: x.children && x.children.map(x => ({
                ...x,
                active: x.active ?? x.path === route.path,
            })),
        } satisfies HeaderItem as HeaderItem;
    });
});
