import { useCallback } from "react";
import { useNotificationStore } from "@/store/useNotificationStore";

let toastCounter = 0;

export default function useNotifications() {
  const { addNotification, removeNotification, clearAll } =
    useNotificationStore();

  const show = useCallback(
    (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
      const toastType = type === "warning" ? "system" : type === "error" ? "system" : type === "success" ? "studyGroupAccepted" : "message";
      addNotification({
        id: `toast-${Date.now()}-${++toastCounter}`,
        userId: "",
        type: toastType as any,
        title: message,
        read: false,
        createdAt: new Date(),
        description: message,
      });
    },
    [addNotification]
  );

  const success = useCallback(
    (message: string) => {
      show(message, "success");
    },
    [show]
  );

  const error = useCallback(
    (message: string) => {
      show(message, "error");
    },
    [show]
  );

  const info = useCallback(
    (message: string) => {
      show(message, "info");
    },
    [show]
  );

  const warning = useCallback(
    (message: string) => {
      show(message, "warning");
    },
    [show]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  const clear = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return {
    show,
    success,
    error,
    info,
    warning,
    dismiss,
    clear,
  };
}
