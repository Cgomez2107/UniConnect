import { Colors } from "@/constants/Colors";
import { fetchApi } from "@/lib/api/httpClient";
import { useToast } from "@/context/ToastContext";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ChannelState {
  in_app_websocket: boolean;
  email_institucional: boolean;
  push_movil: boolean;
}

interface PreferenceEntry {
  eventType: string;
  label: string;
  channels: ChannelState;
}

const CHANNEL_KEYS: (keyof ChannelState)[] = [
  "in_app_websocket",
  "email_institucional",
  "push_movil",
];

const CHANNEL_LABELS: Record<keyof ChannelState, string> = {
  in_app_websocket: "App",
  email_institucional: "Correo",
  push_movil: "Push",
};

export default function NotificacionesAjustesScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<PreferenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchApi<{ preferences: PreferenceEntry[] }>(
          "/notifications/preferences",
        );
        setPreferences(data.preferences);
      } catch {
        showToast("Error al cargar preferencias", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const handleToggle = useCallback(
    async (eventType: string, canal: string, active: boolean) => {
      const key = `${eventType}:${canal}`;
      setSaving(key);

      setPreferences((prev) =>
        prev.map((p) =>
          p.eventType === eventType
            ? { ...p, channels: { ...p.channels, [canal]: active } }
            : p,
        ),
      );

      try {
        await fetchApi("/notifications/preferences", {
          method: "PUT",
          body: JSON.stringify({ eventType, canal, active }),
        });
        showToast("Preferencia actualizada", "success");
      } catch {
        showToast("Error al actualizar preferencia", "error");
        setPreferences((prev) =>
          prev.map((p) =>
            p.eventType === eventType
              ? { ...p, channels: { ...p.channels, [canal]: !active } }
              : p,
          ),
        );
      } finally {
        setSaving(null);
      }
    },
    [showToast],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: C.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
          Configuración de Notificaciones
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.description, { color: C.textSecondary }]}>
          Elige qué notificaciones quieres recibir y por qué canal.
        </Text>

        {/* Header row */}
        <View style={[styles.headerRow, { borderBottomColor: C.border }]}>
          <Text style={[styles.headerCell, styles.eventHeader, { color: C.textSecondary }]}>
            Evento
          </Text>
          {CHANNEL_KEYS.map((canal) => (
            <Text
              key={canal}
              style={[styles.headerCell, styles.channelHeader, { color: C.textSecondary }]}
            >
              {CHANNEL_LABELS[canal]}
            </Text>
          ))}
        </View>

        {preferences.map((pref) => (
          <View
            key={pref.eventType}
            style={[styles.row, { borderBottomColor: C.border }]}
          >
            <Text
              style={[styles.eventLabel, { color: C.textPrimary }]}
              numberOfLines={2}
            >
              {pref.label}
            </Text>
            {CHANNEL_KEYS.map((canal) => {
              const key = `${pref.eventType}:${canal}`;
              const isSaving = saving === key;
              return (
                <View key={canal} style={styles.channelCell}>
                  <Switch
                    value={pref.channels[canal]}
                    disabled={isSaving}
                    onValueChange={(val) =>
                      handleToggle(pref.eventType, canal, val)
                    }
                    trackColor={{
                      false: C.border,
                      true: C.primary,
                    }}
                    thumbColor={
                      pref.channels[canal]
                        ? C.textOnPrimary
                        : C.textSecondary
                    }
                  />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  backBtnText: { fontSize: 24 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600", textAlign: "center" },
  scroll: { padding: 20, paddingBottom: 40 },
  description: { fontSize: 13, marginBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerCell: { fontSize: 12, fontWeight: "500" },
  eventHeader: { flex: 2 },
  channelHeader: { flex: 1, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  eventLabel: { flex: 2, fontSize: 14, paddingRight: 8 },
  channelCell: { flex: 1, alignItems: "center" },
});
