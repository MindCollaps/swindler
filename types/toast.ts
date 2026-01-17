export interface Toast {
    id: string;
    mode: ToastMode;
    title: string;
    message: string;
    duration: number;
}

export interface ShowToastOptions {
    mode?: ToastMode;
    title?: string;
    message: string;
    duration?: number;
}

export enum ToastMode {
    Error = 'Error',
    Success = 'Success',
    Info = 'Info',
    Warning = 'Warning',
}
