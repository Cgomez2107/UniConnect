/**
 * app/perfil-estudiante/[id].tsx
 * Pantalla de perfil público de otro estudiante — US-005
 *
 * Muestra:
 *   - Datos básicos: avatar, nombre, programa, semestre, bio
 *   - Materias en común con el usuario autenticado (intersección)
 *   - Botón para enviar mensaje (integración con US-011)
 *
 * Solo expone materias compartidas. Las materias que el otro estudiante
 * cursa pero el usuario autenticado no, NO se muestran (privacidad).
 *
 * Lógica de datos  -> hooks/useStudentProfile.ts
 * Servicio         -> lib/services/studentService.ts
 */

import { InfoRow } from "@/components/shared/InfoRow"
import { LoadingState } from "@/components/shared/LoadingState"
import { SectionCard } from "@/components/shared/SectionCard"
import { Colors } from "@/constants/Colors"
import { useStudentProfile } from "@/hooks/useStudentProfile"
import { getOrCreateConversation } from "@/lib/services/messagingService"
import { useAuthStore } from "@/store/useAuthStore"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()
  const currentUser = useAuthStore((s) => s.user)
  const [startingChat, setStartingChat] = useState(false)

  const { profile, loading, error, refresh } = useStudentProfile(id)

  // Iniciales del estudiante para el avatar por defecto
  const initials = (profile?.full_name ?? "UC")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  // Iniciar conversación con el estudiante
  const handleStartChat = async () => {
    if (!currentUser?.id || !profile?.id) return
    setStartingChat(true)
    try {
      const conversationId = await getOrCreateConversation(
        currentUser.id,
        profile.id
      )
      router.push(`/chat/${conversationId}` as any)
    } catch {
      Alert.alert("Error", "No se pudo iniciar la conversación.")
    } finally {
      setStartingChat(false)
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: C.background, paddingTop: insets.top },
        ]}
      >
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <LoadingState message="Cargando perfil..." />
      </View>
    )
  }

  // Estado de error o perfil no encontrado
  if (error || !profile) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: C.background, paddingTop: insets.top },
        ]}
      >
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={[styles.errorTitle, { color: C.textPrimary }]}>
            {error ?? "Perfil no encontrado"}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: C.primary }]}
            onPress={refresh}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryBtnText, { color: C.textOnPrimary }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={[styles.backLink, { color: C.primary }]}>
              ← Volver
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: C.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Botón volver */}
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: C.surface }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={[styles.backBtnText, { color: C.textPrimary }]}>
          ← Volver
        </Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── Hero: avatar + datos básicos ────────────────────────────── */}
        <View
          style={[
            styles.hero,
            { backgroundColor: C.surface, borderBottomColor: C.border },
          ]}
        >
          <View style={[styles.topBar, { backgroundColor: C.primary }]} />

          {/* Avatar */}
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={[styles.avatar, { borderColor: C.surface }]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: C.primary, borderColor: C.surface },
              ]}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <View style={[styles.goldAccent, { backgroundColor: C.accent }]} />

          <Text style={[styles.name, { color: C.textPrimary }]}>
            {profile.full_name}
          </Text>

          {/* Badge de programa */}
          {profile.program_name && (
            <View
              style={[
                styles.programBadge,
                {
                  backgroundColor: C.primary + "12",
                  borderColor: C.primary + "30",
                },
              ]}
            >
              <Text style={[styles.programBadgeText, { color: C.primary }]}>
                🎓 {profile.program_name}
              </Text>
            </View>
          )}

          {/* Botón enviar mensaje */}
          <TouchableOpacity
            style={[styles.chatBtn, { backgroundColor: C.primary }]}
            onPress={handleStartChat}
            activeOpacity={0.85}
            disabled={startingChat}
          >
            <Text style={[styles.chatBtnText, { color: C.textOnPrimary }]}>
              {startingChat ? "Abriendo chat..." : "💬 Enviar mensaje"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Información académica ───────────────────────────────────── */}
        <SectionCard title="Información académica">
          {profile.semester && (
            <InfoRow
              emoji="📅"
              label="Semestre"
              value={`${profile.semester}° semestre`}
            />
          )}
          {profile.program_name && (
            <InfoRow emoji="🎓" label="Programa" value={profile.program_name} />
          )}
          {profile.faculty_name && (
            <InfoRow emoji="🏛️" label="Facultad" value={profile.faculty_name} />
          )}
        </SectionCard>

        {/* ── Materias en común ────────────────────────────────────────── */}
        <SectionCard title="Materias en común">
          {profile.shared_subjects.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: C.textPlaceholder,
                textAlign: "center",
                paddingVertical: 12,
              }}
            >
              No comparten materias actualmente
            </Text>
          ) : (
            <View style={styles.chips}>
              {profile.shared_subjects.map((s) => (
                <View
                  key={s.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: C.primary + "10",
                      borderColor: C.primary + "30",
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: C.primary }]}>
                    {s.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text
            style={{
              fontSize: 11,
              color: C.textSecondary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Solo se muestran las materias que ambos están cursando
          </Text>
        </SectionCard>

        {/* ── Sobre el estudiante ──────────────────────────────────────── */}
        <SectionCard title="Sobre este estudiante">
          <Text
            style={{ fontSize: 14, lineHeight: 22, color: C.textSecondary }}
          >
            {profile.bio?.trim()
              ? profile.bio
              : "Este estudiante aún no ha escrito una biografía."}
          </Text>
        </SectionCard>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Back button
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtnText: { fontSize: 15, fontWeight: "600" },
  // Hero section
  hero: {
    alignItems: "center",
    paddingBottom: 24,
    borderBottomWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  topBar: { width: "100%", height: 80, marginBottom: -40 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: "#fff" },
  goldAccent: { width: 32, height: 4, borderRadius: 2, marginBottom: 10 },
  name: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  programBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  programBadgeText: { fontSize: 13, fontWeight: "600" },
  chatBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chatBtnText: { fontSize: 14, fontWeight: "600" },
  // Chips
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  // Error
  errorContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryBtnText: { fontSize: 14, fontWeight: "600" },
  backLink: { fontSize: 14, fontWeight: "500", marginTop: 8 },
})
