import React from "react";
import { MessageUI, UserSessionUI } from "@/types/ui";

interface MessageBubbleProps {
  message: MessageUI;
  currentUser: UserSessionUI | null;
  previousSenderSame?: boolean;
  onReply?: (message: MessageUI) => void;
  onRetry?: (message: MessageUI) => void;
}

function renderContent(content: string) {
  const parts: React.ReactNode[] = [];
  const regex = /@\[([^\]]+)\]\(user:([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }
    const name = match[1];
    const userId = match[2];
    parts.push(
      <span
        key={key++}
        className="text-primary-500 dark:text-primary-400 font-semibold cursor-pointer hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          window.open(`/perfil-estudiante/${userId}`, '_blank');
        }}
      >
        @{name}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : content;
}

export function MessageBubble({
  message,
  currentUser,
  previousSenderSame = false,
  onReply,
  onRetry,
}: MessageBubbleProps) {
  const isOwn = currentUser?.id === message.senderId;
  const isFailed = message.clientStatus === "failed";
  const isSending = message.clientStatus === "sending";
  const isRead = !!message.readAt;

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
          <p className="text-sm whitespace-pre-wrap break-words">{renderContent(message.content)}</p>
          {message.mediaUrl && message.mediaType?.startsWith('image/') ? (
            <img
              src={message.mediaUrl}
              alt="Message attachment"
              className="mt-2 rounded max-h-48 w-auto cursor-pointer"
              onClick={() => window.open(message.mediaUrl!, "_blank")}
            />
          ) : message.mediaUrl ? (
            <div
              className="mt-2 p-3 rounded-lg border border-neutral-300 bg-neutral-50 dark:bg-neutral-700 flex items-center gap-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600"
              onClick={() => window.open(message.mediaUrl!, "_blank")}
            >
              <span className="text-2xl">📎</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{message.content}</p>
                <p className="text-xs text-neutral-500">{message.mediaType || 'Archivo'}</p>
              </div>
            </div>
          ) : null}
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
    </div>
  );
}

export default MessageBubble;
