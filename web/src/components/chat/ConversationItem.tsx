import React from "react";
import { ConversationUI } from "@/types/ui";

interface ConversationItemProps {
  conversation: ConversationUI;
  isSelected: boolean;
  onClick: () => void;
  unreadCount?: number;
}

/**
 * ConversationItem component for displaying a conversation in the conversation list
 */
export function ConversationItem({
  conversation,
  isSelected,
  onClick,
  unreadCount = 0,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 border-b flex items-center justify-between hover:bg-neutral-50 transition-colors ${
        isSelected ? "bg-neutral-100 border-l-4 border-l-primary-500" : ""
      }`}
    >
      <div className="flex-1 text-left">
        <h3 className="font-medium text-neutral-900">
          {conversation.otherUserName || "Chat"}
        </h3>
        <p className="text-sm text-neutral-600 truncate">{conversation.lastMessage || "No hay mensajes aún"}</p>
      </div>
      {unreadCount > 0 && (
        <span className="ml-2 bg-primary-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default ConversationItem;
