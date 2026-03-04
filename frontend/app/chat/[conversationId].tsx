/**
 * app/chat/[conversationId].tsx
 * Hilo de conversación 1:1 — US-011
 *
 * Lógica de datos → hooks/useChat.ts
 * Componentes    → components/chat/MessageBubble, components/chat/ChatInput
 */

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { LoadingState } from "@/components/shared/LoadingState";
import { Colors } from "@/constants/Colors";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/useAuthStore";
import type { Message } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Separador de fecha ────────────────────────────────────────────────────────

function DateSeparator({ date, C }: { date: string; C: (typeof Colors)["light"] }) {
  const d = new Date(date);
  const label = d.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <View style={styles.dateSepRow}>
      <View style={[styles.dateSepLine, { backgroundColor: C.border }]} />
      <Text style={[styles.dateSepText, { color: C.textSecondary, backgroundColor: C.background }]}>
        {label}
      </Text>
      <View style={[styles.dateSepLine, { backgroundColor: C.border }]} />
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { conversationId, otherUserName } = useLocalSearchParams<{
    conversationId: string;
    otherUserName?: string;
  }>();

  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { messages, loading, error, inputText, setInputText, sending, send, flatListRef } =
    useChat(conversationId);

  // Armar la lista con separadores de fecha intercalados
  type ListItem =
    | { type: "msg"; data: Message }
    | { type: "date"; date: string; key: string };

  const listItems: ListItem[] = [];
  let lastDate = "";
  for (const msg of messages) {
    const dayStr = msg.created_at.slice(0, 10);
    if (dayStr !== lastDate) {
      listItems.push({ type: "date", date: msg.created_at, key: `date-${dayStr}` });
      lastDate = dayStr;
    }
    listItems.push({ type: "msg", data: msg });
  }

  const displayName = otherUserName ?? "Chat";

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header con nombre y botón back */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.primary, paddingTop: insets.top + 6 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        {/* Avatar iniciales */}
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {displayName
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </View>

      {/* Cuerpo */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={listItems}
            keyExtractor={(item) =>
              item.type === "msg" ? item.data.id : item.key
            }
            renderItem={({ item }) => {
              if (item.type === "date") {
                return <DateSeparator date={item.date} C={C} />;
              }
              return (
                <MessageBubble
                  message={item.data}
                  isOwn={item.data.sender_id === user?.id || item.data.sender_id === "mock-me"}
                />
              );
            }}
            contentContainerStyle={[
              styles.list,
              messages.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ fontSize: 36 }}>💬</Text>
                <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                  Sé el primero en escribir
                </Text>
              </View>
            }
          />
        )}

        {/* Input de mensaje */}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={send}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 32, color: "#fff", lineHeight: 36 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700", color: "#fff" },

  list: { paddingTop: 12, paddingBottom: 8 },
  listEmpty: { flex: 1 },

  dateSepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  dateSepLine: { flex: 1, height: 1 },
  dateSepText: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 6,
    textTransform: "capitalize",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  emptyText: { fontSize: 15 },
  errorText: { fontSize: 14, textAlign: "center" },
});
