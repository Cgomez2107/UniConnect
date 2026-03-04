/**
 * hooks/useChat.ts
 *
 * Lógica del hilo de chat 1:1:
 * - Carga de mensajes de la conversación
 * - Envío de mensajes (optimistic update)
 * - Suscripción Realtime para recibir mensajes en vivo sin polling
 * - Marca como leídos al abrir
 * - Estado del input de texto
 *
 * Pantalla: app/chat/[conversationId].tsx
 */

import {
  getMessages,
  markConversationRead,
  sendMessage,
} from "@/lib/services/messagingService";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import type { Message } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList } from "react-native";

interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  inputText: string;
  setInputText: (v: string) => void;
  sending: boolean;
  send: () => Promise<void>;
  flatListRef: React.RefObject<FlatList<Message> | null>;
}

export function useChat(conversationId: string): UseChatReturn {
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList<Message>>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Carga inicial + marcar leídos
  useEffect(() => {
    if (!conversationId) return;

    let active = true;
    setLoading(true);
    setError(null);

    getMessages(conversationId)
      .then((data) => {
        if (!active) return;
        setMessages(data);
        if (user?.id) markConversationRead(conversationId, user.id);
      })
      .catch((e) => {
        if (!active) return;
        console.error("[Chat] Error cargando mensajes:", e?.message ?? e);
        setError(e instanceof Error ? e.message : "Error al cargar mensajes");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [conversationId, user?.id]);

  // Realtime: recibir mensajes nuevos del otro participante en vivo
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          // Ignorar si es nuestro propio mensaje (ya fue agregado por optimistic update)
          if (incoming.sender_id === user.id) return;

          setMessages((prev) => {
            // Evitar duplicados
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });

          // Marcar como leído automáticamente al recibirlo con el chat abierto
          markConversationRead(conversationId, user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  // Scroll al último mensaje cuando cambia la lista
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const send = useCallback(async () => {
    const content = inputText.trim();
    if (!content || !user?.id || sending) return;

    // Optimistic update — agregar el mensaje localmente antes de esperar el server
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputText("");
    setSending(true);

    try {
      const confirmed = await sendMessage({ conversation_id: conversationId, content }, user.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? confirmed : m))
      );
    } catch (e: any) {
      // Revertir si falla
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputText(content);
      Alert.alert("Error al enviar", e?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }, [inputText, user?.id, conversationId, sending]);

  return {
    messages,
    loading,
    error,
    inputText,
    setInputText,
    sending,
    send,
    flatListRef,
  };
}
