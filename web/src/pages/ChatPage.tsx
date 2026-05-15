import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "@/lib/api/client";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Avatar } from "@/components/ui/Avatar";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { uploadChatImageFile } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  readAt?: string | null;
  clientStatus?: "sending" | "sent" | "failed";
  replyToMessageId?: string | null;
  replyPreview?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface Conversation {
  id: string;
  otherUserName: string;
  otherUserAvatar?: string;
  type?: "direct" | "group";
  groupId?: string;
  participants?: { id: string; fullName: string }[];
  name?: string;
  description?: string;
}

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const { user: userUI } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);

      try {
        const response = await apiClient.get(`/conversations/${conversationId}`);
        const conv = response.data?.data || response.data;
        setConversation({ ...conv, type: conv.type || "direct" });

        const msgsResponse = await apiClient.get(`/conversations/${conversationId}/messages?limit=50`);
        setMessages(msgsResponse.data?.data?.map((m: any) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender_id || m.senderId,
          senderName: m.sender?.full_name || m.sender?.fullName || m.senderName || "Usuario",
          createdAt: m.created_at || m.createdAt,
          readAt: m.read_at || m.readAt || null,
          clientStatus: "sent",
          replyToMessageId: m.reply_to_message_id || m.replyToMessageId || null,
          replyPreview: m.reply_preview || m.replyPreview || null,
          mediaUrl: m.media_url || m.mediaUrl || null,
          mediaType: m.media_type || m.mediaType || null,
        })) || []);
        return;
      } catch {
        // Not a conversation, try as study group
      }

      // Try as study group chat
      const groupResponse = await apiClient.get(`/study-groups/${conversationId}/chat`);
      const group = groupResponse.data?.data || groupResponse.data;
      setConversation({
        id: conversationId!,
        otherUserName: group.name || "Grupo de Estudio",
        type: "group",
        groupId: conversationId,
        name: group.name,
        description: group.description,
        participants: group.members || group.participants || [],
      });

      const msgs = group.messages || group.chat || [];
      setMessages(msgs.map((m: any) => ({
        id: m.id,
        content: m.content,
        senderId: m.sender_id || m.senderId,
        senderName: m.sender?.full_name || m.sender?.fullName || m.senderName || "Usuario",
        createdAt: m.created_at || m.createdAt,
        readAt: m.read_at || m.readAt || null,
        clientStatus: "sent",
      })) || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchConversation();

    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
    const token = localStorage.getItem("accessToken");
    const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", conversationId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = data.payload || data;

        if (data.event === "new_message") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [...prev, { ...payload, clientStatus: "sent" }];
          });
        } else if (data.type === "message" || data.event === "message:received") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
        } else if (data.event === "user:typing") {
          setTypingUsers((prev) => {
            if (!prev.includes(payload.userName)) {
              return [...prev, payload.userName];
            }
            return prev;
          });
        } else if (data.event === "user:stopped-typing") {
          setTypingUsers((prev) => prev.filter((n) => n !== payload.userName));
        }
      } catch {
        // ignore
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.send(JSON.stringify({ type: "unsubscribe", conversationId }));
      }
      ws.close();
      wsRef.current = null;
    };
  }, [conversationId, user, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: newMessage.trim(),
      senderId: user?.id || "",
      senderName: "Tú",
      createdAt: new Date().toISOString(),
      readAt: null,
      clientStatus: "sending",
      replyToMessageId: replyingTo?.id || null,
      replyPreview: replyingTo?.content || null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    const replyTo = replyingTo;
    setReplyingTo(null);
    setIsSending(true);

    try {
      const response = await apiClient.post("/messages", {
        conversationId,
        content: optimisticMsg.content,
        reply_to_message_id: replyTo?.id || undefined,
      });
      const msg = response.data?.data || response.data;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: msg.id, clientStatus: "sent", readAt: null }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, clientStatus: "failed" } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = async (failedMsg: any) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, clientStatus: "sending" } : m))
    );
    try {
      const response = await apiClient.post("/messages", {
        conversationId,
        content: failedMsg.content,
        reply_to_message_id: failedMsg.replyToMessageId || undefined,
      });
      const msg = response.data?.data || response.data;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id
            ? { ...m, id: msg.id, content: msg.content, clientStatus: "sent" }
            : m
        )
      );
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
    if (!file || !conversationId) return;

    setUploadingImage(true);
    try {
      const mediaUrl = await uploadChatImageFile(conversationId, file);
      if (!mediaUrl) throw new Error("Error al subir imagen");

      const response = await apiClient.post("/messages", {
        conversationId,
        content: file.name,
        media_url: mediaUrl,
        media_type: file.type,
      });
      const msg = response.data?.data || response.data;
      setMessages((prev) => [...prev, {
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id || msg.senderId || user?.id || "",
        senderName: "Tú",
        createdAt: msg.created_at || msg.createdAt || new Date().toISOString(),
        readAt: null,
        clientStatus: "sent",
        mediaUrl,
        mediaType: file.type,
      }]);
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const chatTitle = conversation?.type === "group"
    ? conversation.name || "Chat Grupal"
    : conversation?.otherUserName || "Chat";
  const isGroup = conversation?.type === "group";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Volver"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </button>
          <Avatar
            name={conversation?.otherUserName}
            size="sm"
          />
          <div>
            <h1 className="text-base font-bold text-neutral-900">{chatTitle}</h1>
            {isGroup && conversation?.participants && (
              <p className="text-xs text-neutral-500">
                {conversation.participants.length} miembros
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">
            <p>No hay mensajes aún. ¡Inicia la conversación!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={{
                id: msg.id,
                conversationId: conversationId || "",
                senderId: msg.senderId,
                content: msg.content,
                createdAt: msg.createdAt,
                readAt: msg.readAt || null,
                clientStatus: msg.clientStatus || "sent",
                replyToMessageId: msg.replyToMessageId || null,
                replyPreview: msg.replyPreview || null,
                mediaUrl: msg.mediaUrl || null,
                mediaType: msg.mediaType || null,
              }}
              currentUser={userUI}
              previousSenderSame={
                index > 0 && messages[index - 1].senderId === msg.senderId
              }
              onRetry={handleRetry}
              onReply={(m) => setReplyingTo(m)}
            />
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="text-sm text-neutral-500 italic animate-fade-in">
            <span className="inline-flex items-center gap-1">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "está" : "están"} escribiendo
              <span className="animate-pulse">...</span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-primary-50 border-t border-primary-200 flex items-center gap-2">
          <span className="text-xs text-primary-700 flex-1 truncate">
            Respondiendo a: {replyingTo.content}
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-primary-500 hover:text-primary-700 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-neutral-200 p-4">
        <div className="flex gap-2 items-end">
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
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full px-4 py-2.5 pr-10 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              disabled={isSending}
            />
          </div>
          <Button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            loading={isSending}
          >
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};
