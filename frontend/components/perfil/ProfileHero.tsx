/**
 * components/perfil/ProfileHero.tsx
 *
 * Sección superior del perfil:
 * - Avatar (foto o iniciales)
 * - Nombre, email
 * - Badge de programa principal
 * - Botón "Editar perfil"
 */

import { Colors } from "@/constants/Colors"
import { router } from "expo-router"
import { Image, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface Props {
  fullName: string
  email: string
  initials: string
  avatarUrl: string | null
  primaryProgramName: string
  hasPrimaryProgram: boolean
}

export function ProfileHero({
  fullName,
  email,
  initials,
  avatarUrl,
  primaryProgramName,
  hasPrimaryProgram,
}: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View
      style={[
        styles.hero,
        { backgroundColor: C.surface, borderBottomColor: C.border },
      ]}
    >
      {/* Franja de color superior */}
      <View style={[styles.topBar, { backgroundColor: C.primary }]} />

      {/* Avatar */}
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
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

      <Text style={[styles.name, { color: C.textPrimary }]}>{fullName}</Text>
      <Text style={[styles.email, { color: C.textSecondary }]}>{email}</Text>

      {hasPrimaryProgram && (
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
            🎓 {primaryProgramName}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.editBtn, { borderColor: C.primary }]}
        onPress={() => router.push("/editar-perfil")}
        activeOpacity={0.8}
      >
        <Text style={[styles.editBtnText, { color: C.primary }]}>
          Editar perfil
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
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
    marginBottom: 4,
  },
  email: { fontSize: 13, marginBottom: 10 },
  programBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  programBadgeText: { fontSize: 13, fontWeight: "600" },
  editBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  editBtnText: { fontSize: 14, fontWeight: "600" },
})
