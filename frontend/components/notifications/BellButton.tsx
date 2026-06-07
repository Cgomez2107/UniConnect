import { Colors } from "@/constants/Colors";
import { useNotificationStore, type NotificationData } from "@/store/useNotificationStore";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const TYPE_ICONS: Record<string, string> = {
  transferencia_admin_solicitada: "🔄",
  transferencia_admin_aceptada: "✅",
  solicitud_ingreso: "📋",
  miembro_aceptado: "✅",
  miembro_rechazado: "❌",
  nuevo_evento: "📅",
};

export default function BellButton() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const [open, setOpen] = useState(false);
  const notifications = useNotificationStore((s) => s.queue);

  const recent = notifications.slice(0, 10);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.bellBtn}
        activeOpacity={0.7}
      >
        <Text style={[styles.bellIcon, { color: C.text }]}>🔔</Text>
        {notifications.length > 0 && (
          <View style={[styles.badge, { backgroundColor: C.error }]}>
            <Text style={styles.badgeText}>
              {notifications.length > 99 ? "99+" : notifications.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: C.surface }]}>
            <View style={[styles.header, { borderBottomColor: C.border }]}>
              <Text style={[styles.title, { color: C.textPrimary }]}>
                Notificaciones
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={[styles.closeBtn, { color: C.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {recent.length === 0 ? (
                <Text style={[styles.empty, { color: C.textSecondary }]}>
                  No hay notificaciones
                </Text>
              ) : (
                recent.map((n: NotificationData) => {
                  const icon = TYPE_ICONS[n.type] ?? "🔔";
                  return (
                    <View
                      key={n.id ?? Math.random()}
                      style={[
                        styles.item,
                        { borderBottomColor: C.border },
                      ]}
                    >
                      <Text style={styles.itemIcon}>{icon}</Text>
                      <View style={styles.itemContent}>
                        <Text
                          style={[styles.itemTitle, { color: C.textPrimary }]}
                          numberOfLines={2}
                        >
                          {n.title}
                        </Text>
                        <Text
                          style={[styles.itemDesc, { color: C.textSecondary }]}
                          numberOfLines={1}
                        >
                          {n.body}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.ajustesBtn, { borderTopColor: C.border }]}
              onPress={() => {
                setOpen(false);
                router.back();
              }}
            >
              <Text style={[styles.ajustesText, { color: C.primary }]}>
                Configurar notificaciones
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    position: "relative",
    padding: 8,
  },
  bellIcon: {
    fontSize: 22,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  closeBtn: {
    fontSize: 20,
    padding: 4,
  },
  list: {
    maxHeight: 300,
  },
  listContent: {
    paddingBottom: 8,
  },
  empty: {
    textAlign: "center",
    paddingVertical: 40,
    fontSize: 14,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ajustesBtn: {
    borderTopWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  ajustesText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
