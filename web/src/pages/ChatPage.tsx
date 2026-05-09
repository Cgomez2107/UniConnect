import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "../lib/httpClient";

interface Message {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUserName: string;
}

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchConversation();
  }, [conversationId, user, navigate]);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(
        `/conversations/${conversationId}`
      );
      setConversation(response.data);

      const messagesResponse = await apiClient.get(
        `/messages?conversationId=${conversationId}&limit=50`
      );
      setMessages(messagesResponse.data?.data || []);
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
        content: newMessage,
      });

      setMessages([...messages, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando conversación...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      <header className="bg-primary-600 text-white p-4">
        <h1 className="text-xl font-bold">
          Chat: {conversation?.otherUserName}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderName === (user ? `${user.firstName} ${user.lastName}` : '') ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderName === (user ? `${user.firstName} ${user.lastName}` : '')
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-neutral-200"
              }`}
            >
              <p className="text-sm font-medium opacity-70">
                {msg.senderName}
              </p>
              <p>{msg.content}</p>
              <p className="text-xs opacity-50 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSending ? "..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
};
