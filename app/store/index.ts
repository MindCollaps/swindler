import type { MeUserObject } from '~~/types/socket';
import { socket } from '~/components/socket';
import { defineStore } from 'pinia';

export const useStore = defineStore('index', {
    state: () => ({
        version: '',
        theme: 'default' as ThemesList,
        lobbyCode: '',
        me: undefined as MeUserObject | undefined,
        setupDone: false,
    }),
    actions: {
        setup() {
            this.fetchMe();
        },
        fetchMe() {
            socket.emit('me');
        },
    },
});
