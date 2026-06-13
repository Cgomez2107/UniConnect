import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "@/constants/Colors"
import { fetchApiEnvelope } from "@/lib/api/httpClient"
import { lookupUserNames } from "@/lib/lookupProfiles"
import { useColorScheme } from "@/hooks/useColorScheme"

interface ModerationAlert {
  id: string
  userId: string
  type: string
  title: string
  body: string
  payload: Record<string, unknown> | null
  createdAt: string
  readAt: string | null
}

export default function ModeracionScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()

  const [alerts, setAlerts] = useState<ModerationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await fetchApiEnvelope<any[]>(
          "/notifications?limit=100"
        )
        const raw = Array.isArray(data) ? data : []
        const seen = new Set<string>()
        const filtered: ModerationAlert[] = []
        for (const n of raw) {
          if (n.type !== "moderation_escalation") continue
          if (seen.has(n.id)) continue
          seen.add(n.id)
          filtered.push({
            id: n.id,
            userId: (n.payload?.userId as string) ?? (n.data?.userId as string) ?? "N/A",
            type: n.type,
            title: n.title ?? "",
            body: n.description ?? n.body ?? "",
            payload: n.payload ?? n.data ?? null,
            createdAt: n.createdAt ?? "",
            readAt: n.readAt ?? null,
          })
        }
        setAlerts(filtered)

        const userIds = filtered
          .map((a) => a.userId)
          .filter((id): id is string => id !== "N/A" && !!id)
        if (userIds.length > 0) {
          setUserNames(await lookupUserNames(userIds))
        }
      } catch (e: any) {
        setError(e.message ?? "Error al cargar alertas de moderación")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const formatBody = (alert: ModerationAlert): string => {
    const userName = alert.userId !== "N/A"
      ? (userNames[alert.userId] ?? "Cargando...")
      : "N/A"
    return alert.body.replace(alert.userId, userName)
  }

  const renderAlert = useCallback(
    ({ item }: { item: ModerationAlert }) => {
      const userName = item.userId !== "N/A"
        ? (userNames[item.userId] ?? "Cargando...")
        : "N/A"

      return (
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: "#fef2f2" }]}>
              <Ionicons name="shield-checkmark" size={14} color="#dc2626" />
              <Text style={styles.badgeText}>Revisión Humana Requerida</Text>
            </View>
            <Text style={[styles.dateText, { color: C.textSecondary }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
            {item.title}
          </Text>

          <Text style={[styles.cardBody, { color: C.textSecondary }]}>
            {formatBody(item)}
          </Text>

          <View style={styles.userRow}>
            <Ionicons name="person-outline" size={16} color={C.textSecondary} />
            <Text style={[styles.userName, { color: C.textPrimary }]}>
              {userName}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
            onPress={() => router.push("/(admin)?tab=usuarios" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={16} color={C.primary} />
            <Text style={[styles.actionBtnText, { color: C.primary }]}>
              Gestionar Usuario
            </Text>
          </TouchableOpacity>
        </View>
      )
    },
    [userNames, C]
  )

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={C.error} />
        <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: C.primary }]}
            onPress={() => router.replace("/(admin)/moderacion" as any)}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: C.textPrimary }]}>Moderación</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            {alerts.length} caso(s) activo(s)
          </Text>
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={64} color={C.textSecondary} />
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
              El sistema está limpio
            </Text>
            <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
              No hay casos de moderación pendientes de revisión.
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  listContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    padding: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#dc2626", textTransform: "uppercase", letterSpacing: 0.5 },
  dateText: { fontSize: 11 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardBody: { fontSize: 13, lineHeight: 18 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 14, fontWeight: "600" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
})
