import { useState, useCallback } from "react";
import { ApiChatbotRepository } from "../../lib/services/infrastructure/repositories/ApiChatbotRepository";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const chatbotRepository = new ApiChatbotRepository();

export function useChatbotLogic() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    // Since we use FlatList with inverted={true}, we prepend new messages
    setMessages((prev) => [userMsg, ...prev]);
    setIsTyping(true);

    try {
      // Build history in chronological order (oldest first)
      const history = [...messages]
        .reverse()
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await chatbotRepository.sendMessage(text, history);

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        createdAt: new Date(),
      };

      setMessages((prev) => [botMsg, ...prev]);
    } catch (error) {
      console.error("Error in useChatbotLogic:", error);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Lo siento, hubo un error de conexión con el asistente virtual. Por favor, intenta de nuevo más tarde.",
        createdAt: new Date(),
      };
      setMessages((prev) => [errorMsg, ...prev]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, isTyping]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage: handleSendMessage,
    clearHistory,
  };
}
