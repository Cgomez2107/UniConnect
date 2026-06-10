/**
 * app/chat/[conversationId].tsx
 * Hilo de chat 1:1 — US-011
 *
 * Lógica de datos → hooks/useChat.ts
 * Componentes     → components/chat/MessageBubble.tsx
 *                   components/chat/ChatInput.tsx
 */

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Colors } from "@/constants/Colors";
import { useChatComposer } from "@/hooks/application/useChatComposer";
import { useMessaging } from "@/hooks/application/useMessaging";
import { useMessageValidation } from "@/hooks/useMessageValidation";
import { ValidationErrorCode } from "@uniconnect/shared-types";
import { useAuthStore } from "@/store/useAuthStore";
import { useUnreadCountStore } from "@/store/unreadCountStore";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Message } from "@/types";

interface DayDividerItem {
  type: "day";
  id: string;
  label: string;
}

interface MessageItem {
  type: "message";
  id: string;
  message: Message;
}

type ChatListItem = DayDividerItem | MessageItem;

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return "Hoy";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Ayer";

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


export default function ChatScreen() {
  const { conversationId, otherUserName } = useLocalSearchParams<{
    conversationId: string;
    otherUserName?: string;
  }>();

  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList<ChatListItem>>(null);
  const refreshUnreadCount = useUnreadCountStore((s) => s.refreshUnreadCount);

  const {
    messages,
    loading,
    error,
    getMessages,
    sendMessage,
    retryMessage,
    handleMarkAsRead,
    subscribeToConversation,
    voteInPoll,
  } = useMessaging();

  const conversationIdValue = typeof conversationId === "string" ? conversationId : "";
  const userId = user?.id ?? "";

  const chatItems = useMemo<ChatListItem[]>(() => {
    // Sort messages chronologically to ensure contiguous grouping and correct order
    const sortedMessages = [...messages].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
      const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
      return timeA - timeB;
    });

    const items: ChatListItem[] = [];
    let lastDayKey = "";

    for (const msg of sortedMessages) {
      const createdTime = msg.created_at || new Date().toISOString();
      const d = new Date(createdTime);
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      const dayKey = `${validDate.getFullYear()}-${validDate.getMonth()}-${validDate.getDate()}`;

      if (dayKey !== lastDayKey) {
        items.push({
          type: "day",
          id: `day-${dayKey}-${msg.id}`, // Incorporate message ID to guarantee uniqueness
          label: formatDayLabel(validDate.toISOString()),
        });
        lastDayKey = dayKey;
      }

      items.push({
        type: "message",
        id: msg.id,
        message: msg,
      });
    }

    return items;
  }, [messages]);


  useEffect(() => {
    if (!conversationIdValue) return;
    getMessages(conversationIdValue).catch(() => undefined);
  }, [conversationIdValue, getMessages]);

  useEffect(() => {
    if (!conversationIdValue || !userId) return;
    subscribeToConversation(conversationIdValue, userId);
  }, [conversationIdValue, userId, subscribeToConversation]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    return () => {
      sub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const markAsRead = async () => {
        if (!conversationIdValue) return;
        try {
          await handleMarkAsRead(conversationIdValue);
        } catch {
          if (!isMounted) return;
          // Silent error - don't interrupt user experience if marking as read fails
        }
      };

      void markAsRead();

      return () => {
        isMounted = false;
        void refreshUnreadCount();
      };
    }, [conversationIdValue, handleMarkAsRead, refreshUnreadCount])
  );

  const {
    typing,
    handleReply,
    handleRetry,
    chatInputProps,
  } = useChatComposer({
    conversationId: conversationIdValue,
    userId: user?.id,
    sendMessage,
    retryMessage,
  });

  // Integrar validación
  const { validationState, validateMessage, clearValidation } = useMessageValidation({
    maxLength: 1000,
    debounceMs: 300,
  });

  // Estado para errores de validación del backend
  const [backendValidationError, setBackendValidationError] = useState<{
    code: ValidationErrorCode;
    message: string;
  } | null>(null);

  // Combinar estado de validación local y backend
  const combinedValidationState = backendValidationError
    ? {
        ...validationState,
        isValid: false,
        error: {
          code: backendValidationError.code,
          message: backendValidationError.message,
        },
      }
    : validationState;

  // Wrapper para el onChange que valida mientras escribe
  const handleTextChange = useCallback((text: string) => {
    chatInputProps.text.onChangeText(text);
    chatInputProps.text.onTyping(text);
    setBackendValidationError(null);
    // Validar mientras escribe (debounced)
    void validateMessage(text);
  }, [chatInputProps, validateMessage, setBackendValidationError]);

  // Wrapper para validar antes de enviar
  const handleSendWithValidation = useCallback(async () => {
    const currentText = chatInputProps.text.value;
    if (!currentText.trim()) return;

    // Validar localmente (ej: longitud)
    const state = await validateMessage(currentText);
    if (!state.isValid) {
      return;
    }

    // Enviar directamente para que el backend maneje la moderación
    try {
      await chatInputProps.send.onSend();
      clearValidation();
      setBackendValidationError(null);
    } catch (err: any) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      const message = err instanceof Error ? err.message : String(err);
      // Check if it's a validation error from backend
      if (code === "MO_001" || message.includes("MO_001") || message.includes("límite permitido")) {
        // Longitud excedida
        setBackendValidationError({
          code: ValidationErrorCode.MESSAGE_TOO_LONG,
          message: "Tu mensaje supera el límite permitido de caracteres (1000).",
        });
      } else if (
        code === "MO_002" ||
        message.includes("MO_002") ||
        message.includes("palabras prohibidas") ||
        message.includes("normas de la comunidad") ||
        message.includes("infringen")
      ) {
        // Palabras prohibidas
        setBackendValidationError({
          code: ValidationErrorCode.FORBIDDEN_WORDS,
          message: "Tu mensaje contiene palabras que infringen las normas de la comunidad.",
        });
      }
    }
  }, [chatInputProps, validateMessage, clearValidation, setBackendValidationError]);

  const displayName = otherUserName
    ? decodeURIComponent(otherUserName)
    : "Chat";

  const displayFirstName = useMemo(
    () => displayName.split(" ")[0],
    [displayName],
  );

  function getInitials(name: string): string {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const openMediaViewer = useCallback((url: string) => {
    router.push({
      pathname: "/viewer",
      params: {
        url,
        title: "Imagen del chat",
        fileName: "imagen-chat.jpg",
        fileType: "jpg",
      },
    });
  }, []);

  const keyExtractor = useCallback((item: ChatListItem) => item.id, []);

  const listContentStyle = useMemo(
    () => [styles.list, messages.length === 0 && styles.listEmpty],
    [messages.length],
  );

  const handleContentSizeChange = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
  }, []);

  const renderChatItem = useCallback(
    ({ item }: { item: ChatListItem }) => {
      if (item.type === "day") {
        return (
          <View style={styles.dayDividerWrap}>
            <View style={[styles.dayDivider, { backgroundColor: C.surface }]}>
              <Text style={[styles.dayDividerText, { color: C.textSecondary }]}>{item.label}</Text>
            </View>
          </View>
        );
      }

      return (
        <MessageBubble
          message={item.message}
          isOwn={item.message.sender_id === user?.id}
          currentUserId={user?.id}
          onReply={handleReply}
          onRetry={handleRetry}
          onOpenMedia={openMediaViewer}
          onVote={async (messageId, optionIndex) => {
            await voteInPoll(messageId, optionIndex).catch((err) =>
              console.error("vote error:", err),
            );
          }}
        />
      );
    },
    [C.surface, C.textSecondary, user?.id, handleReply, handleRetry, openMediaViewer, voteInPoll],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: C.primary,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
          <Text style={styles.headerAvatarText}>{getInitials(displayName)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.headerSub}>{typing ? "Escribiendo..." : "Chat privado"}</Text>
        </View>
      </View>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>⚠️</Text>
          <Text style={[styles.errorText, { color: C.textPrimary }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef as any}
          data={chatItems}
          keyExtractor={keyExtractor}
          renderItem={renderChatItem}
          contentContainerStyle={listContentStyle}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44 }}>💬</Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
                Aún no hay mensajes
              </Text>
              <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
                Saluda a {displayFirstName} para empezar a coordinar.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={handleContentSizeChange}
        />
      )}

      {/* ── Input ───────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <ChatInput
          {...{
            text: { ...chatInputProps.text, onChangeText: handleTextChange },
            reply: chatInputProps.reply,
            media: chatInputProps.media,
            send: { ...chatInputProps.send, onSend: handleSendWithValidation },
            voice: chatInputProps.voice,
          }}
          validationState={combinedValidationState}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 22,
    color: "#fff",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },

  // Lista
  list: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  listEmpty: {
    flex: 1,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Error / loading
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  dayDividerWrap: {
    alignItems: "center",
    marginVertical: 8,
  },
  dayDivider: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    opacity: 0.9,
  },
  dayDividerText: {
    fontSize: 11,
    fontWeight: "600",
  },
});