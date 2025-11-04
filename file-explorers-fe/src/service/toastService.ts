import { inject } from "vue";
import type { ToastServiceMethods } from "primevue/toastservice";

// Store reference to toast service
let toastService: ToastServiceMethods | null = null;

export function setToastService(service: ToastServiceMethods) {
    toastService = service;
}

export function getToastService(): ToastServiceMethods | null {
    return toastService;
}

export function showLevelCompleteToast(levelName: string) {
    if (toastService) {
        toastService.add({
            severity: "success",
            summary: "Level Complete! 🎉",
            detail: `Congratulations! You completed ${levelName}!`,
            life: 5000,
        });
    } else {
        // Fallback to alert if toast service not available
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
