import type { MeUserObject } from '~~/types/socket';
import { defineStore } from 'pinia';

export const useStore = defineStore('index', {
    state: () => ({
        version: '',
        theme: 'default' as ThemesList,
        lobbyCode: '',
        me: undefined as MeUserObject | undefined,
        ready: false,
    }),
    actions: {
    },
});
