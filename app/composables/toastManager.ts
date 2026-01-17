import { ToastMode } from '~~/types/toast';
import type { Toast, ShowToastOptions } from '~~/types/toast';
import { useStore } from '~/store';
import { v4 } from 'uuid';
import type { Socket } from 'socket.io-client';

export function useToastManager() {
    const store = useStore();

    const showToast = (options: ShowToastOptions) => {
        const toast: Toast = {
            id: v4(),
            mode: options.mode ?? ToastMode.Info,
            title: options.title ?? (options.mode ?? 'Info'),
            message: options.message,
            duration: options.duration ?? 8000, // 8 seconds
        };

        return store.addToast(toast);
    };

    const removeToast = (id: string) => {
        store.removeToast(id);
    };

    return {
        showToast,
        removeToast,
    };
}

export function registerToastManager(socket: Socket) {
    const { showToast } = useToastManager();

    socket.on('errorMessage', message => {
        showToast({
            mode: ToastMode.Error,
            message: message,
        });
    });

    socket.on('infoMessage', message => {
        showToast({
            mode: ToastMode.Info,
            message: message,
        });
    });

    socket.on('warningMessage', message => {
        showToast({
            mode: ToastMode.Warning,
            message: message,
        });
    });

    socket.on('successMessage', message => {
        showToast({
            mode: ToastMode.Success,
            message: message,
        });
    });
}

