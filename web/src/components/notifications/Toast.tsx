import React from "react";
import { X } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: number;
}

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

/**
 * Toast component for displaying notifications
 */
export function Toast({ notification, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  }[notification.type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-slide-in`}
    >
      <span className="text-sm">{notification.message}</span>
      <button
        onClick={onClose}
        className="hover:opacity-80 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default Toast;
