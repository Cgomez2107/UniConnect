import React from "react";
import { MessageUI, UserSessionUI } from "@/types/ui";

interface MessageBubbleProps {
  message: MessageUI;
  currentUser: UserSessionUI | null;
  previousSenderSame?: boolean;
}

/**
 * MessageBubble component for displaying individual messages in chat
 * @param message - Message object to display
 * @param currentUser - Current authenticated user
 * @param previousSenderSame - Whether the previous message was from the same sender
 */
export function MessageBubble({
  message,
  currentUser,
  previousSenderSame = false,
}: MessageBubbleProps) {
  const isOwn = currentUser?.id === message.senderId;

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 ${
        previousSenderSame ? "mt-1" : "mt-4"
      }`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn
            ? "bg-uc-blue text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        {message.mediaUrl && (
          <img
            src={message.mediaUrl}
            alt="Message attachment"
            className="mt-2 rounded max-h-48 w-auto"
          />
        )}
        <p
          className={`text-xs mt-1 ${
            isOwn ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
