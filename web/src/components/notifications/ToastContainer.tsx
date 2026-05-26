import React from "react";
import { Toast } from "./Toast";
import { useNotificationStore } from "@/store/useNotificationStore";

const TOAST_TYPE_MAP: Record<string, "success" | "error" | "info" | "warning"> = {
  system: "error",
  message: "info",
  studyGroupApplication: "info",
  studyGroupAccepted: "success",
  studyGroupRejected: "warning",
  mention: "info",
  friendRequest: "info",
};

function getToastType(notificationType: string): "success" | "error" | "info" | "warning" {
  return TOAST_TYPE_MAP[notificationType] ?? "info";
}

function isToastNotification(n: any): boolean {
  return n.id?.startsWith("toast-");
}

export function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore();
  const toasts = notifications.filter(isToastNotification);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((notification) => (
        <Toast
          key={notification.id}
          notification={{
            id: notification.id,
            type: getToastType(notification.type),
            message: notification.title || notification.description || "",
            timestamp: notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now(),
          }}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
