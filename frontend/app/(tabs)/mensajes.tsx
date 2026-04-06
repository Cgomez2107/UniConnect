/**
 * app/(tabs)/mensajes.tsx
 * Lista de conversaciones privadas — US-011
 *
 * Lógica de datos → hooks/useConversations.ts
 * Navega a → app/chat/[conversationId].tsx
 */

import { LoadingState } from "@/components/shared/LoadingState";
import { Colors } from "@/constants/Colors";
import { useConversations } from "@/hooks/application/useConversations";
import type { Conversation } from "@/types";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { memo, useCallback, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// ── Item de conversación ──────────────────────────────────────────────────────

interface ItemProps {
  item: Conversation;
  onPress: (conv: Conversation) => void;
  C: (typeof Colors)["light"];
}

const ConversationItem = memo(function ConversationItem({ item, onPress, C }: ItemProps) {
  const hasUnread = item.unread_count > 0;
  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: C.surface, borderBottomColor: C.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar con iniciales */}
      <View style={[styles.avatar, { backgroundColor: C.primary }]}>
        <Text style={styles.avatarText}>{getInitials(item.other_user_name)}</Text>
        {hasUnread && (
          <View style={[styles.badge, { backgroundColor: C.accent }]}>
            <Text style={[styles.badgeText, { color: C.primary }]}>
              {item.unread_count > 9 ? "9+" : item.unread_count}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text
            style={[
              styles.name,
              { color: C.text, fontWeight: hasUnread ? "700" : "600" },
            ]}
            numberOfLines={1}
          >
            {item.other_user_name}
          </Text>
          {item.last_message_at && (
            <Text style={[styles.date, { color: C.textSecondary }]}>
              {formatRelativeDate(item.last_message_at)}
            </Text>
          )}
        </View>
        <Text
          style={[
            styles.preview,
            {
              color: hasUnread ? C.text : C.textSecondary,
              fontWeight: hasUnread ? "600" : "400",
            },
          ]}
          numberOfLines={1}
        >
          {item.last_message ?? "Sin mensajes aún"}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function MensajesScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { conversations, loading, refreshing, error, refresh } = useConversations();

  const handlePress = useCallback((conv: Conversation) => {
    router.push({
      pathname: "/chat/[conversationId]",
      params: {
        conversationId: conv.id,
        otherUserName: conv.other_user_name,
      },
    });
  }, []);

  const renderConversationItem = useCallback(
    ({ item }: { item: Conversation }) => <ConversationItem item={item} onPress={handlePress} C={C} />,
    [handlePress, C],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  const listContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + 16 }),
    [insets.bottom],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={refresh}
        colors={[C.primary]}
        tintColor={C.primary}
      />
    ),
    [refreshing, refresh, C.primary],
  );

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.primary, paddingTop: insets.top + 8 },
        ]}
      >
        <Text style={styles.headerTitle}>Mensajes</Text>
      </View>

      {/* Contenido */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>💬</Text>
          <Text style={[styles.emptyTitle, { color: C.text }]}>Sin conversaciones</Text>
          <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
            Postúlate a una solicitud de estudio para iniciar un chat con el autor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={keyExtractor}
          renderItem={renderConversationItem}
          refreshControl={refreshControl}
          contentContainerStyle={listContentStyle}
        />
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  info: { flex: 1 },
  infoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  name: { fontSize: 15, flex: 1, marginRight: 8 },
  date: { fontSize: 12 },
  preview: { fontSize: 13 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  errorText: { fontSize: 14, textAlign: "center" },
});
