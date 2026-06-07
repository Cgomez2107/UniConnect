import { useState, useEffect, useRef } from "react";
import useConversations from "@/hooks/useConversations";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Avatar } from "@/components/ui/Avatar";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import messagingService, { groupReactions } from "@/lib/services/messaging.service";
import { apiClient } from "@/lib/api/client";

import { uploadChatImageFile } from "@/lib/supabase";
import { useUnreadCountStore } from "@/store/useUnreadCountStore";
import { useAuthStore } from "@/store/useAuthStore";
import { isForbiddenContent } from "@/hooks/useMessageValidation";
import { ValidationErrorCode, ValidationErrorMessages } from "@uniconnect/shared-types";
import { getWsUrl } from "@/lib/wsUrl";

export function MensajesPage() {
  const { user } = useAuth();
  const authStore = useAuthStore();
  const { conversations = [], loading: conversationsLoading = false } = useConversations();
  const unreadStore = useUnreadCountStore();
  const setConversationUnread = unreadStore.setConversationUnread;
  const incrementUnread = unreadStore.incrementUnread;
  const clearConversationUnread = unreadStore.clearConversationUnread;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [conversationsList, setConversationsList] = useState<typeof conversations>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!selectedConversation?.id) return;

    const load = async () => {
      setLoadingMessages(true);
      try {
        const msgs = await messagingService.getMessages(selectedConversation.id);
        setMessages((msgs || []).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ));
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    load();

    const raw = localStorage.getItem("uniconnect-auth-session");
    const token = useAuthStore.getState().accessToken || (raw ? (JSON.parse(raw)?.state?.accessToken ?? null) : null);
    const ws = new WebSocket(`${getWsUrl()}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "subscribe",
        conversationId: selectedConversation.id,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "new_message") {
          const raw = data.payload;
          if (raw && raw.id) {
            const isOwnMessage = raw.sender_id === user?.id || raw.senderId === authStore.user?.id;
            if (!isOwnMessage) {
              const convId = raw.conversation_id || raw.conversationId;
              incrementUnread(convId);
              setConversationsList((prev) =>
                prev.map((c) =>
                  c.id === convId
                    ? { ...c, lastMessage: raw.content ?? c.lastMessage, lastMessageAt: raw.created_at ?? c.lastMessageAt }
                    : c
                )
              );
            }
            import("@/utils/mappers").then(({ mapMessageApiToUI }) => {
              const msg = mapMessageApiToUI(raw);
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            });
          }
        } else if (data.event === "reaction_updated") {
          const { messageId, reactions } = data.payload || {};
          if (messageId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId ? { ...m, reactions: groupReactions(reactions || []) } : m,
              ),
            );
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      console.warn("WebSocket error for conversation, falling back to polling");
      const interval = setInterval(() => {
        messagingService.getMessages(selectedConversation.id)
          .then((msgs) => setMessages(msgs || []))
          .catch(console.error);
      }, 5000);
      pollingRef.current = interval;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.send(JSON.stringify({
          type: "unsubscribe",
          conversationId: selectedConversation.id,
        }));
      }
      ws.close();
      wsRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
    setConversationsList(conversations);
    conversations.forEach((c) => {
      if (c.unreadCount > 0) {
        setConversationUnread(c.id, c.unreadCount);
      }
    });
  }, [conversations, setConversationUnread]);

  useEffect(() => {
    if (conversations.length !== conversationsList.length) {
      setConversationsList(conversations);
    }
  }, [conversations, conversationsList.length]);
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    if (isForbiddenContent(messageText)) {
      alert(ValidationErrorMessages[ValidationErrorCode.BANNED_CONTENT]);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: user?.id || "",
      content: messageText.trim(),
      createdAt: new Date().toISOString(),
      readAt: null,
      clientStatus: "sending",
      replyToMessageId: replyingTo?.id || null,
      replyPreview: replyingTo?.content || null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText("");
    const replyTo = replyingTo;
    setReplyingTo(null);

    try {
      const msg = await messagingService.sendMessage(
        selectedConversation.id,
        optimisticMsg.content,
        replyTo ? { replyToMessageId: replyTo.id } : undefined
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? { ...msg, clientStatus: "sent", readAt: null } : m));
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, clientStatus: "failed" } : m
        )
      );
    }
  };

  const handleRetry = async (failedMsg: any) => {
    if (!selectedConversation) return;
    if (isForbiddenContent(failedMsg.content || "")) {
      alert(ValidationErrorMessages[ValidationErrorCode.BANNED_CONTENT]);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id ? { ...m, clientStatus: "failed" } : m
        )
      );
      return;
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, clientStatus: "sending" } : m))
    );
    try {
      const msg = await messagingService.sendMessage(
        selectedConversation.id,
        failedMsg.content,
        failedMsg.replyToMessageId ? { replyToMessageId: failedMsg.replyToMessageId } : undefined
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.filter((m) => m.id !== failedMsg.id);
        }
        return prev.map((m) => (m.id === failedMsg.id ? { ...msg, clientStatus: "sent" } : m));
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id ? { ...m, clientStatus: "failed" } : m
        )
      );
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setUploadingImage(true);
    try {
      const mediaUrl = await uploadChatImageFile(selectedConversation.id, file);
      if (!mediaUrl) throw new Error("Error al subir imagen");

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        conversationId: selectedConversation.id,
        senderId: user?.id || "",
        content: file.name,
        createdAt: new Date().toISOString(),
        readAt: null,
        clientStatus: "sending",
        mediaUrl,
        mediaType: file.type,
        mediaFilename: file.name,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const msg = await messagingService.sendMessage(
        selectedConversation.id,
        file.name,
        { mediaUrl, mediaType: file.type, mediaFilename: file.name }
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) =>
          m.id === tempId ? { ...m, ...msg, clientStatus: "sent", mediaUrl: m.mediaUrl || msg.mediaUrl } : m
        );
      });
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const toggleMobileConversations = () => {
    setSelectedConversation(null);
  };

  const showListOnly = !selectedConversation;

  useEffect(() => {
    if (selectedConversation?.id) {
      messagingService.markAsRead(selectedConversation.id).catch(() => {});
      clearConversationUnread(selectedConversation.id);
    }
  }, [selectedConversation?.id, messages, clearConversationUnread]);

  return (
    <div className="min-h-screen bg-neutral-50 flex animate-fade-in">
      {/* Conversations sidebar */}
      <div className={`${showListOnly ? "flex" : "hidden"} md:flex w-full md:w-80 bg-white border-r border-neutral-200 flex-col`}>
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-lg font-bold text-neutral-900">Mensajes</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 skeleton rounded" />
                    <div className="h-2.5 w-1/2 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <p>Sin conversaciones</p>
            </div>
          ) : (
            conversationsList.map((conversation) => {
              const unread = unreadStore.conversationUnreadCounts[conversation.id] ?? conversation.unreadCount ?? 0;
              return (
                <div key={conversation.id} className="md:cursor-pointer" onClick={() => setSelectedConversation(conversation)}>
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  unreadCount={unread}
                />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedConversation ? (
        <div className={`${showListOnly ? "hidden" : "flex"} md:flex flex-1 flex-col bg-white`}>
          <div className="p-4 border-b border-neutral-200 flex items-center gap-3">
            <Avatar
              name={selectedConversation.otherUserName}
              size="sm"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-neutral-900">
                {selectedConversation.otherUserName || "Chat"}
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {loadingMessages ? (
              <div className="text-center text-neutral-500 py-8">Cargando mensajes...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-neutral-500 py-8">
                No hay mensajes aún. ¡Inicia la conversación!</div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUser={user}
                  previousSenderSame={
                    index > 0 && messages[index - 1].senderId === message.senderId
                  }
                  onReply={(msg) => setReplyingTo(msg)}
                  onRetry={handleRetry}
                  onToggleReaction={async (messageId, emoji) => {
                    const result = await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
                    const data = result.data?.data || result.data;
                    const flat = data.reactions ?? [];
                    const grouped = groupReactions(flat);
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === messageId ? { ...m, reactions: grouped } : m
                      )
                    );
                  }}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-neutral-200 flex gap-3 items-end"
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="p-2.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              title="Subir imagen"
            >
              {uploadingImage ? (
                <span className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5m0 0l5 5m-5-5v12" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              disabled={sendingMessage}
            />
            <Button
              type="submit"
              loading={sendingMessage}
              disabled={!messageText.trim()}
            >
              Enviar
            </Button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-neutral-500">
          <div className="text-center">
            <p>Selecciona una conversación para empezar a chatear</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MensajesPage;
