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
import { useAuthStore } from "@/store/useAuthStore";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef } from "react";
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

  const {
    messages,
    loading,
    error,
    getMessages,
    sendMessage,
    retryMessage,
    handleMarkAsRead,
  } = useMessaging();

  const conversationIdValue = typeof conversationId === "string" ? conversationId : "";

  const chatItems = useMemo<ChatListItem[]>(() => {
    const items: ChatListItem[] = [];
    let lastDayKey = "";

    for (const msg of messages) {
      const d = new Date(msg.created_at);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayKey !== lastDayKey) {
        items.push({
          type: "day",
          id: `day-${dayKey}`,
          label: formatDayLabel(msg.created_at),
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
      // Mark all messages in this conversation as read when the screen is focused
      if (conversationIdValue) {
        handleMarkAsRead(conversationIdValue).catch(() => {
          // Silent error - don't interrupt user experience if marking as read fails
        });
      }
    }, [conversationIdValue, handleMarkAsRead])
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
          onReply={handleReply}
          onRetry={handleRetry}
          onOpenMedia={openMediaViewer}
        />
      );
    },
    [C.surface, C.textSecondary, user?.id, handleReply, handleRetry, openMediaViewer],
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
        <ChatInput {...chatInputProps} />
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