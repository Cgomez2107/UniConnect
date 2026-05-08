import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useMessages from "@/hooks/useMessages";
import useConversations from "@/hooks/useConversations";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { MessageBubble } from "@/components/chat/MessageBubble";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

/**
 * MensajesPage - Chat and messaging interface
 */
export function MensajesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations = [], isLoading: conversationsLoading = false } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      // TODO: Implement send message
      setMessageText("");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-gray-600">Cargando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-600">
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

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedConversation.participantName}
            </h2>
            <button className="text-gray-600 hover:text-gray-900">
              ⋯
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUser={user}
                previousSenderSame={
                  index > 0 && messages[index - 1].senderId === message.senderId
                }
              />
            ))}
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 flex gap-3"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-uc-blue"
              disabled={sendingMessage}
            />
            <Button
              type="submit"
              loading={sendingMessage}
              onClick={handleSendMessage}
            >
              Enviar
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600">
          Selecciona una conversación
        </div>
      )}
    </div>
  );
}

export default MensajesPage;
