import React, { useState, useRef, useEffect } from "react";
import { useChatbot } from "@/hooks/useChatbot";
import { MessageSquare, X, Send, Trash2, Bot, Sparkles, Loader2 } from "lucide-react";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearHistory } = useChatbot();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setInputValue("");
    await sendMessage(trimmed);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    await sendMessage(suggestion);
  };

  const suggestions = [
    "¿Cómo puedo crear un grupo de estudio?",
    "¿Dónde veo mis próximos eventos?",
    "¿Cómo subir un recurso de estudio?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] h-[520px] max-w-[calc(100vw-2rem)] bg-white dark:bg-neutral-900 rounded-2xl shadow-elevated border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-slide-up transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-3 flex items-center justify-between text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative p-1.5 bg-white/10 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-white rounded-full animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight flex items-center gap-1">
                  UniConnect AI
                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                </h3>
                <span className="text-[10px] text-primary-100">Asistente Virtual</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  title="Limpiar chat"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-primary-100 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-primary-100 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-neutral-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-6">
                <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-full text-primary-600 dark:text-primary-400">
                  <Bot className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                    ¡Hola! Soy el asistente virtual de UniConnect
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[280px]">
                    Puedo ayudarte a navegar por la plataforma, resolver dudas sobre grupos, eventos y recursos. ¿Con qué empezamos?
                  </p>
                </div>
                
                {/* Suggestions */}
                <div className="w-full space-y-2 pt-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-2.5 bg-white dark:bg-neutral-850 hover:bg-primary-50 dark:hover:bg-primary-950/20 border border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-900 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 font-medium transition-all duration-200 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm leading-relaxed ${
                          isUser
                            ? "bg-gradient-to-tr from-primary-600 to-indigo-600 text-white rounded-br-none"
                            : "bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl rounded-bl-none px-3.5 py-3 shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        Pensando...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntame algo..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white disabled:opacity-60 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-40 disabled:hover:bg-primary-600 transition-colors shadow-sm flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 relative group`}
        title="UniConnect AI Assistant"
      >
        <div className="relative">
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-300" />
          ) : (
            <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:rotate-6" />
          )}
          {!isOpen && (
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 border-2 border-white rounded-full animate-bounce"></span>
          )}
        </div>
      </button>
    </div>
  );
}
