import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useMessages from "@/hooks/useMessages";
import useConversations from "@/hooks/useConversations";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { MessageBubble } from "@/components/chat/MessageBubble";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import messagingService from "@/lib/services/messaging.service";

export function MensajesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations = [], loading: conversationsLoading = false, selectConversation: selectConv } = useConversations();
  const { loadMessages, sendMessage: sendMsg } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  useEffect(() => {
    if (!selectedConversation?.id) return;

    const load = async () => {
      setLoadingMessages(true);
      try {
        const msgs = await messagingService.getMessages(selectedConversation.id);
        setMessages(msgs || []);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    load();

    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
    const ws = new WebSocket(`${WS_URL}/conversations/${selectedConversation.id}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" || data.event === "message:received") {
          setMessages((prev) => [...prev, data.payload || data]);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => console.warn("WebSocket error for conversation");

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [selectedConversation?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const msg = await messagingService.sendMessage(
        selectedConversation.id,
        messageText.trim()
      );
      setMessages((prev) => [...prev, msg]);
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <div className="w-full md:w-80 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900">Mensajes</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-neutral-600">Cargando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-neutral-600">
              Sin conversaciones
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => setSelectedConversation(conversation)}
              />
            ))
          )}
        </div>
      </div>

      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-900">
              {selectedConversation.otherUserName || "Chat"}
            </h2>
            {selectedConversation.type === "group" && (
              <button
                className="text-sm text-primary-600 hover:text-primary-700"
                onClick={() => navigate(`/chat/${selectedConversation.id}`)}
              >
                Info del grupo
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingMessages ? (
              <div className="text-center text-neutral-500 py-4">Cargando mensajes...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-neutral-500 py-4">
                No hay mensajes aún. ¡Escribe algo!
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUser={user}
                  previousSenderSame={
                    index > 0 && messages[index - 1].senderId === message.senderId
                  }
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-neutral-200 flex gap-3"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
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
        <div className="flex-1 flex items-center justify-center text-neutral-600">
          Selecciona una conversación
        </div>
      )}
    </div>
  );
}

export default MensajesPage;
