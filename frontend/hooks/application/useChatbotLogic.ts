import { useState, useCallback } from "react";
import { ApiChatbotRepository } from "../../lib/services/infrastructure/repositories/ApiChatbotRepository";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  referencias?: {
    id?: string;
    source?: string;
    similarity?: number | null;
  }[];
}

const chatbotRepository = new ApiChatbotRepository();

export function useChatbotLogic() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinkingLong, setIsThinkingLong] = useState(false);

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
    setIsThinkingLong(false);

    const abortController = new AbortController();

    const timeout10s = setTimeout(() => {
      setIsThinkingLong(true);
    }, 10000);

    const timeout15s = setTimeout(() => {
      abortController.abort();
    }, 15000);

    try {
      // Build history in chronological order (oldest first)
      const history = [...messages]
        .reverse()
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await chatbotRepository.sendMessage(text, history, abortController.signal);

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        createdAt: new Date(),
        referencias: response.referencias,
      };

      setMessages((prev) => [botMsg, ...prev]);
    } catch (error: any) {
      console.error("Error in useChatbotLogic:", error);
      const isAborted = error.name === "AbortError" || abortController.signal.aborted;
      const content = isAborted
        ? "El asistente está tomando más tiempo de lo esperado en conectar con la base de datos de UniConnect. Por favor intenta en unos minutos."
        : "Lo siento, hubo un error de conexión con el asistente virtual. Por favor, intenta de nuevo más tarde.";

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date(),
      };
      setMessages((prev) => [errorMsg, ...prev]);
    } finally {
      clearTimeout(timeout10s);
      clearTimeout(timeout15s);
      setIsTyping(false);
      setIsThinkingLong(false);
    }
  }, [messages, isTyping]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    isThinkingLong,
    sendMessage: handleSendMessage,
    clearHistory,
  };
}
