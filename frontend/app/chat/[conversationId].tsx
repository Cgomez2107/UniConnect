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
import { useMessaging } from "@/hooks/application/useMessaging";
import { useAuthStore } from "@/store/useAuthStore";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Message } from "@/types";

export default function ChatScreen() {
  const { conversationId, otherUserName } = useLocalSearchParams<{
    conversationId: string;
    otherUserName?: string;
  }>();

  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const {
    messages,
    loading,
    error,
    getMessages,
    sendMessage,
  } = useMessaging();

  const conversationIdValue = typeof conversationId === "string" ? conversationId : "";

  useEffect(() => {
    if (!conversationIdValue) return;
    getMessages(conversationIdValue).catch(() => undefined);
  }, [conversationIdValue, getMessages]);

  const send = useCallback(async () => {
    if (!conversationIdValue || !user?.id) return;
    const content = inputText.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationIdValue, user.id, content);
      setInputText("");
    } finally {
      setSending(false);
    }
  }, [conversationIdValue, user?.id, inputText, sending, sendMessage]);

  const displayName = otherUserName
    ? decodeURIComponent(otherUserName)
    : "Chat";

  function getInitials(name: string): string {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
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
          onPress={() => router.back()}
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
          <Text style={styles.headerSub}>Chat privado</Text>
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
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === user?.id}
            />
          )}
          contentContainerStyle={[
            styles.list,
            messages.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44 }}>💬</Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
                Aún no hay mensajes
              </Text>
              <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
                Saluda a {displayName.split(" ")[0]} para empezar a coordinar.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {/* ── Input ───────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={send}
          sending={sending}
        />
      )}
    </View>
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
    paddingVertical: 12,
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
});