import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageUI, UserSessionUI } from "@/types/ui";
import { buildDecoratedMessage } from "@/chat/models/messageFactory.js";
import type { IRenderContext } from "@/chat/models/IMessage.js";
import type { FileData } from "@/chat/models/IMessage.js";
import { ReactionBar } from "./ReactionBar";
import { PollMessage } from "./PollMessage";
interface MessageBubbleProps {
  message: MessageUI;
  currentUser: UserSessionUI | null;
  previousSenderSame?: boolean;
  onReply?: (message: MessageUI) => void;
  onRetry?: (message: MessageUI) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onVote?: (messageId: string, optionIndex: number) => void;
}

export function MessageBubble({
  message,
  currentUser,
  previousSenderSame = false,
  onReply,
  onRetry,
  onToggleReaction,
  onVote,
}: MessageBubbleProps) {
  const navigate = useNavigate();
  const isOwn = currentUser?.id === message.senderId;
  const isFailed = message.clientStatus === "failed";
  const isSending = message.clientStatus === "sending";
  const isRead = !!message.readAt;

  const decoratorContext: IRenderContext = useMemo(
    () => ({
      currentUserId: currentUser?.id,
      viewFile: (file: FileData) =>
        navigate(
          `/viewer?url=${encodeURIComponent(file.url)}&title=${encodeURIComponent(file.filename)}&fileName=${encodeURIComponent(file.filename)}&fileType=${encodeURIComponent(file.mimeType)}`,
        ),
    }),
    [currentUser?.id, navigate],
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
        poll: message.poll,
      }),
    [message.id, message.content, message.senderId, message.createdAt,
     message.mediaUrl, message.mediaType, message.mediaFilename,
     message.mentions, message.reactions, message.poll],
  );

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 ${
        previousSenderSame ? "mt-1" : "mt-4"
      } ${isFailed ? "opacity-60" : ""}`}
    >
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
          {(() => {
            console.log("[DEBUG] MessageBubble poll:", { id: message.id, hasPoll: !!message.poll, pollType: message.poll ? typeof message.poll : 'undefined', content: message.content });
            return null;
          })()}
          {message.poll && (
            <PollMessage
              poll={message.poll}
              currentUserId={currentUser?.id}
              senderId={message.senderId}
              onVote={(optionIndex) => onVote?.(message.id, optionIndex)}
            />
          )}
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
        <ReactionBar
          reactions={message.reactions ?? []}
          currentUserId={currentUser?.id}
          onToggleReaction={(emoji) => onToggleReaction?.(message.id, emoji)}
        />
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
    </div>
  );
}

export default MessageBubble;
