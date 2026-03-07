/**
 * components/feed/StudentCard.tsx
 * Tarjeta de resultado de búsqueda de compañeros — US-005
 *
 * Muestra datos básicos del estudiante encontrado:
 *   - Avatar (iniciales si no hay foto)
 *   - Nombre completo
 *   - Programa y facultad
 *   - Semestre
 *   - Bio (truncada a 2 líneas)
 *   - Botón para ver perfil completo
 */

import { Colors } from "@/constants/Colors"
import type { StudentSearchResult } from "@/types"
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"

interface Props {
  student: StudentSearchResult
  onViewProfile: (studentId: string) => void
}

export function StudentCard({ student, onViewProfile }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  // Iniciales del nombre para el avatar por defecto
  const initials = (student.full_name ?? "UC")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={() => onViewProfile(student.id)}
      activeOpacity={0.92}
    >
      {/* Header: avatar + info */}
      <View style={styles.header}>
        {student.avatar_url ? (
          <Image
            source={{ uri: student.avatar_url }}
            style={[styles.avatar, { borderColor: C.primary + "30" }]}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: C.primary + "20", borderColor: C.primary + "30" }]}>
            <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: C.textPrimary }]} numberOfLines={1}>
            {student.full_name}
          </Text>

          {student.program_name && (
            <Text style={[styles.program, { color: C.textSecondary }]} numberOfLines={1}>
              🎓 {student.program_name}
            </Text>
          )}

          <View style={styles.metaRow}>
            {student.semester && (
              <Text style={[styles.meta, { color: C.textSecondary }]}>
                📅 Semestre {student.semester}
              </Text>
            )}
            {student.faculty_name && (
              <Text style={[styles.meta, { color: C.textSecondary }]} numberOfLines={1}>
                🏛️ {student.faculty_name}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Bio */}
      {student.bio && (
        <Text style={[styles.bio, { color: C.textSecondary }]} numberOfLines={2}>
          {student.bio}
        </Text>
      )}

      {/* Footer: botón ver perfil */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.profileBtn, { backgroundColor: C.primary }]}
          onPress={() => onViewProfile(student.id)}
          activeOpacity={0.85}
        >
          <Text style={[styles.profileBtnText, { color: C.textOnPrimary }]}>
            Ver perfil
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  program: { fontSize: 12, marginBottom: 2 },
  metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  meta: { fontSize: 11 },
  bio: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  profileBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 7,
  },
  profileBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
})
