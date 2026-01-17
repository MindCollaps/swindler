import type { MeUserObject } from '~~/types/socket';
import type { Toast } from '~~/types/toast';
import { defineStore } from 'pinia';

export const useStore = defineStore('index', {
    state: () => ({
        version: '',
        theme: 'default' as ThemesList,
        lobbyCode: '',
        me: undefined as MeUserObject | undefined,
        ready: false,
        toasts: [] as Toast[],
    }),
    actions: {
        addToast(toast: Toast) {
            // limit to 3 toasts at the same time and remove the oldest
            this.toasts.push(toast);
            if (this.toasts.length > 3) {
                this.toasts.shift();
            }

            // Auto-remove after duration
            setTimeout(() => {
                this.removeToast(toast.id);
            }, toast.duration);
        },
        removeToast(id: string) {
            const index = this.toasts.findIndex(t => t.id === id);
            if (index !== -1) {
                this.toasts.splice(index, 1);
            }
        },
    },
});
