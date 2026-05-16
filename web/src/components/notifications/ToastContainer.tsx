import React from "react";
import { Toast } from "./Toast";
import { useNotificationStore } from "@/store/useNotificationStore";

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
            type: "info",
            message: notification.title || notification.description || "",
            timestamp: notification.createdAt instanceof Date ? notification.createdAt.getTime() : Date.now(),
          }}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
