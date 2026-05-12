import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "@/lib/api/client";
import { MessageBubble } from "@/components/chat/MessageBubble";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUserName: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchConversation();

    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
    const ws = new WebSocket(`${WS_URL}/conversations/${conversationId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = data.payload || data;

        if (data.type === "message" || data.event === "message:received") {
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
      ws.close();
      wsRef.current = null;
    };
  }, [conversationId, user, navigate]);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);

      // Try as conversation first, then as study group chat
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
      })) || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await apiClient.post("/messages", {
        conversationId,
        content: newMessage.trim(),
      });
      const msg = response.data?.data || response.data;
      setMessages((prev) => [...prev, {
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id || msg.senderId || user?.id || "",
        senderName: msg.sender?.full_name || msg.sender?.fullName || msg.senderName || "Tú",
        createdAt: msg.created_at || msg.createdAt || new Date().toISOString(),
      }]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const chatTitle = conversation?.type === "group"
    ? conversation.name || "Chat Grupal"
    : conversation?.otherUserName || "Chat";
  const isGroup = conversation?.type === "group";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <p className="text-neutral-600">Cargando conversación...</p>
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
            className="text-neutral-600 hover:text-neutral-900"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">{chatTitle}</h1>
            {isGroup && conversation?.participants && (
              <p className="text-xs text-neutral-500">
                {conversation.participants.length} miembros
              </p>
            )}
          </div>
        </div>
        {isGroup && (
          <button
            className="text-sm text-primary-600 hover:text-primary-700"
            onClick={() => {/* could show group info modal */}}
          >
            Info
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            No hay mensajes aún. ¡Inicia la conversación!
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
                readAt: null,
              }}
              currentUser={userUI}
              previousSenderSame={
                index > 0 && messages[index - 1].senderId === msg.senderId
              }
            />
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="text-sm text-neutral-500 italic">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "está" : "están"} escribiendo...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-neutral-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
            disabled={isSending}
          />
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
