import { Colors } from "@/constants/Colors"
import type { Insignia } from "@/types"
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native"
import { useState } from "react"

interface Props {
  insignias: Insignia[]
}

const BADGE_EMOJI_FALLBACK: Record<string, string> = {
  "primer-mensaje": "💬",
  conversador: "🗣️",
  colaborador: "🤝",
  "trabajador-equipo": "👥",
  "sucesor-confiable": "✅",
  "lider-emerito": "👑",
  primer_publicacion: "📝",
  red_social: "🌐",
  estrella: "⭐",
  experto: "🏆",
  veterano: "🎖️",
};

function badgeKey(insignia: Insignia, index: number): string {
  return insignia.id || insignia.nombre || `badge-${index}`;
}

function fechaLocal(raw: string): string {
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString(); } catch { return ""; }
}

function BadgeIcon({ insignia }: { insignia: Insignia }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (insignia.iconoUrl && !imgFailed) {
    return (
      <Image
        source={{ uri: insignia.iconoUrl }}
        style={styles.badgeImage}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <Text style={styles.badgeIcon}>{BADGE_EMOJI_FALLBACK[insignia.id] ?? "🏅"}</Text>;
}

export function BadgePanel({ insignias }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  if (!insignias || insignias.length === 0) return null

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[styles.title, { color: C.primary }]}>Insignias</Text>
      <View style={styles.grid}>
        {insignias.map((insignia, index) => {
          const hasFecha = !!insignia.fechaObtenida;
          return (
            <View
              key={badgeKey(insignia, index)}
              style={[
                styles.badge,
                {
                  backgroundColor: C.accent + "18",
                  borderColor: C.accent + "40",
                },
              ]}
            >
              <BadgeIcon insignia={insignia} />
              <Text
                style={[styles.badgeName, { color: C.textPrimary }]}
                numberOfLines={2}
              >
                {insignia.nombre}
              </Text>
              {hasFecha && (
                <Text style={[styles.badgeDate, { color: C.textSecondary }]}>
                  {fechaLocal(insignia.fechaObtenida)}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badge: {
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: 80,
  },
  badgeIcon: { fontSize: 24, marginBottom: 4 },
  badgeImage: { width: 32, height: 32, marginBottom: 4 },
  badgeName: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  badgeDate: { fontSize: 9, marginTop: 2 },
})
