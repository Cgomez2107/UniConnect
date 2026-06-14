import { useState, useEffect } from "react";
import chatbotService from "../lib/services/chatbot.service";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  referencias?: {
    id?: string;
    source?: string;
    similarity?: number | null;
  }[];
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem("uniconnect_chatbot_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingLong, setIsThinkingLong] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem("uniconnect_chatbot_history", JSON.stringify(messages));
    } catch (err) {
      console.warn("Failed to save chatbot history to sessionStorage", err);
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    
    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsThinkingLong(false);

    const abortController = new AbortController();

    const timeout10s = setTimeout(() => {
      setIsThinkingLong(true);
    }, 10000);

    const timeout15s = setTimeout(() => {
      abortController.abort();
    }, 15000);

    try {
      // Build the history for the API (only include user and assistant messages)
      const apiHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await chatbotService.sendMessageToChatbot(text, apiHistory, abortController.signal);
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.reply,
        referencias: response.referencias,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message to chatbot:", error);
      
      const isAborted = error.name === "AbortError" || abortController.signal.aborted;
      const content = isAborted
        ? "El asistente está tomando más tiempo de lo esperado en conectar con la base de datos de UniConnect. Por favor intenta en unos minutos."
        : "Lo siento, hubo un error de conexión con el asistente virtual. Por favor, intenta de nuevo más tarde.";

      const errorMessage: ChatMessage = {
        role: "assistant",
        content,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      clearTimeout(timeout10s);
      clearTimeout(timeout15s);
      setIsLoading(false);
      setIsThinkingLong(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    sessionStorage.removeItem("uniconnect_chatbot_history");
  };

  return {
    messages,
    isLoading,
    isThinkingLong,
    sendMessage,
    clearHistory,
  };
}
