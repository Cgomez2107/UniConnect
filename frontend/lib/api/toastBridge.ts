import type { ToastType } from "../../context/ToastContext";

type ToastFn = (message: string, type: ToastType, duration?: number) => void;

let showToastFn: ToastFn | null = null;

export function setToastBridge(fn: ToastFn): void {
  showToastFn = fn;
}

export function showToastBridge(message: string, type: ToastType = "error", duration?: number): void {
  if (showToastFn) {
    showToastFn(message, type, duration);
  } else {
    console.warn("[ToastBridge] ToastProvider no inicializado. Mensaje no mostrado:", message);
  }
}
