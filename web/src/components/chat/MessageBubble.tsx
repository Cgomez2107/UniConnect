import React, { useMemo } from "react";
import { MessageUI, UserSessionUI } from "@/types/ui";
import { buildDecoratedMessage } from "@/chat/models/messageFactory.js";
import type { IRenderContext } from "@/chat/models/IMessage.js";
import { ReactionBar } from "./ReactionBar";
interface MessageBubbleProps {
  message: MessageUI;
  currentUser: UserSessionUI | null;
  previousSenderSame?: boolean;
  onReply?: (message: MessageUI) => void;
  onRetry?: (message: MessageUI) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  currentUser,
  previousSenderSame = false,
  onReply,
  onRetry,
  onToggleReaction,
}: MessageBubbleProps) {
  const isOwn = currentUser?.id === message.senderId;
  const isFailed = message.clientStatus === "failed";
  const isSending = message.clientStatus === "sending";
  const isRead = !!message.readAt;

  const decoratorContext: IRenderContext = useMemo(
    () => ({ currentUserId: currentUser?.id }),
    [currentUser?.id],
  );

  const decoratedMessage = useMemo(
    () =>
      buildDecoratedMessage({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        mediaFilename: message.mediaFilename,
        mentions: message.mentions,
        reactions: message.reactions,
      }),
    [message.id, message.content, message.senderId, message.createdAt,
     message.mediaUrl, message.mediaType, message.mediaFilename,
     message.mentions, message.reactions],
  );

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 ${
        previousSenderSame ? "mt-1" : "mt-4"
      } ${isFailed ? "opacity-60" : ""}`}
    >
      {/* Reaction bar on the outside, positioned to the side */}
      {!isOwn && (
        <div className="flex items-end mr-1">
          <ReactionBar
            reactions={message.reactions ?? []}
            currentUserId={currentUser?.id}
            onToggleReaction={(emoji) => onToggleReaction?.(message.id, emoji)}
          />
        </div>
      )}

      <div className="max-w-xs lg:max-w-md">
        {message.replyToMessageId && message.replyPreview && (
          <div
            className={`text-xs px-3 py-1.5 rounded-t-lg truncate ${
              isOwn ? "bg-primary-700 text-primary-200" : "bg-neutral-300 text-neutral-600"
            }`}
          >
            <span className="font-semibold">Respondiendo a: </span>
            {message.replyPreview}
          </div>
        )}
        <div
          className={`px-4 py-2 ${
            message.replyToMessageId ? "rounded-b-lg" : "rounded-lg"
          } ${
            isOwn
              ? "bg-primary-600 text-white rounded-br-none"
              : "bg-neutral-200 text-neutral-800 rounded-bl-none"
          }`}
        >
          <div className="text-sm whitespace-pre-wrap break-words">
            {decoratedMessage.render(decoratorContext)}
          </div>
          <div className={`flex items-center justify-end gap-1 mt-1`}>
            <span className={`text-xs ${isOwn ? "text-primary-200" : "text-neutral-500"}`}>
              {new Date(message.createdAt).toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isOwn && (
              <span className={`text-xs ${isRead ? "text-blue-300" : "text-primary-300"}`}>
                {isRead ? "✓✓" : isSending ? "..." : "✓"}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-1 px-1">
          {onReply && (
            <button
              onClick={() => onReply(message)}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Responder
            </button>
          )}
          {isOwn && isFailed && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="text-[10px] text-error-500 hover:text-error-600 font-medium transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>

      {/* For own messages, reaction bar on the right */}
      {isOwn && (
        <div className="flex items-end ml-1">
          <ReactionBar
            reactions={message.reactions ?? []}
            currentUserId={currentUser?.id}
            onToggleReaction={(emoji) => onToggleReaction?.(message.id, emoji)}
          />
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
