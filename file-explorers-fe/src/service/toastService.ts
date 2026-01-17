import { inject } from "vue";
import type { ToastServiceMethods } from "primevue/toastservice";

// Store reference to toast service
let toastService: ToastServiceMethods | null = null;

// Store reference to level complete dialog handler
let levelCompleteHandler: ((levelName: string) => void) | null = null;

export function setToastService(service: ToastServiceMethods) {
    toastService = service;
}

export function getToastService(): ToastServiceMethods | null {
    return toastService;
}

export function setLevelCompleteHandler(handler: (levelName: string) => void) {
    levelCompleteHandler = handler;
}

export function showLevelCompleteToast(levelName: string) {
    if (levelCompleteHandler) {
        levelCompleteHandler(levelName);
    } else {
        // Fallback to alert if handler not available
        alert(`🎉 Congratulations! You completed ${levelName}!`);
    }
}

export function showErrorToast(message: string) {
    if (toastService) {
        toastService.add({
            severity: "error",
            summary: "Error",
            detail: message,
            life: 3000,
        });
    } else {
        console.error(message);
    }
}
