import React from "react";
import { ConversationUI } from "@/types/ui";
import { Avatar } from "@/components/ui/Avatar";

interface ConversationItemProps {
  conversation: ConversationUI;
  isSelected: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
  unreadCount = 0,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
        isSelected ? "bg-primary-50 border-l-4 border-l-primary-500" : "border-l-4 border-l-transparent"
      }`}
    >
      <Avatar
        name={conversation.otherUserName}
        size="sm"
        className="flex-shrink-0"
      />
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-neutral-900 text-sm truncate">
            {conversation.otherUserName || "Chat"}
          </h3>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate mt-0.5">
          {conversation.lastMessage || "No hay mensajes aún"}
        </p>
      </div>
    </button>
  );
}

export default ConversationItem;
