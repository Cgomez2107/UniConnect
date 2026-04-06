/**
 * components/feed/ResourceCard.tsx
 * Tarjeta de recurso compartido — US-006
 *
 * Muestra título, materia, autor, tipo de archivo, tamaño y fecha.
 * Al tocar abre la pantalla de detalle del recurso.
 */

import { Colors } from "@/constants/Colors"
import type { StudyResource } from "@/types"
import { memo, useCallback } from "react"
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"

interface Props {
  item: StudyResource
  isOwn?: boolean
  onOpen: (item: StudyResource) => void
}

// Icono según tipo de archivo
const FILE_ICONS: Record<string, string> = {
  PDF: "📄",
  DOCX: "📝",
  DOC: "📝",
  XLSX: "📊",
  XLS: "📊",
  PPTX: "📽️",
  PPT: "📽️",
  TXT: "📃",
  JPG: "🖼️",
  JPEG: "🖼️",
  PNG: "🖼️",
}

function formatSize(kb: number | null): string {
  if (!kb) return ""
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}sem`
}

export const ResourceCard = memo(function ResourceCard({ item, isOwn = false, onOpen }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  const handleOpen = useCallback(() => {
    onOpen(item)
  }, [onOpen, item])

  const fileType = item.file_type?.toUpperCase() ?? "?"
  const icon = FILE_ICONS[fileType] ?? "📎"
  const authorName = item.profiles?.full_name ?? "Estudiante"
  const subjectName = item.subjects?.name ?? ""

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={handleOpen}
      activeOpacity={0.92}
    >
      {/* ── Header: icono + info ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: C.primary + "12" }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: C.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.meta, { color: C.textSecondary }]}>
            {authorName} · {getTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>

      {/* ── Materia tag ───────────────────────────────────────────────── */}
      {subjectName ? (
        <View style={[styles.subjectTag, { backgroundColor: C.primary + "12" }]}>
          <Text style={[styles.subjectText, { color: C.primary }]}>{subjectName}</Text>
        </View>
      ) : null}

      {/* ── Descripción ───────────────────────────────────────────────── */}
      {item.description ? (
        <Text style={[styles.description, { color: C.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {/* ── Footer: tipo + tamaño + badge propio ────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.typeBadge, { backgroundColor: C.border }]}>
            <Text style={[styles.typeText, { color: C.textSecondary }]}>{fileType}</Text>
          </View>
          {item.file_size_kb ? (
            <Text style={[styles.sizeText, { color: C.textSecondary }]}>
              {formatSize(item.file_size_kb)}
            </Text>
          ) : null}
        </View>

        <View style={styles.footerRight}>
          {isOwn && (
            <View style={[styles.ownBadge, { borderColor: C.accent }]}>
              <Text style={[styles.ownBadgeText, { color: C.accent }]}>Tuyo</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.openBtn, { backgroundColor: C.primary }]}
            onPress={handleOpen}
            activeOpacity={0.85}
          >
            <Text style={[styles.openBtnText, { color: C.textOnPrimary }]}>Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 22 },
  headerInfo: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  meta: { fontSize: 12 },
  subjectTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectText: { fontSize: 12, fontWeight: "600" },
  description: { fontSize: 13, lineHeight: 18 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: { fontSize: 11, fontWeight: "700" },
  sizeText: { fontSize: 12 },
  ownBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ownBadgeText: { fontSize: 11, fontWeight: "600" },
  openBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openBtnText: { fontSize: 13, fontWeight: "600" },
})
