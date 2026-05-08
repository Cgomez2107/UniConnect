import React from "react";
import { Toast } from "./Toast";
import { useNotificationStore } from "@/store/useNotificationStore";

/**
 * ToastContainer component - renders all active notifications
 */
export function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
