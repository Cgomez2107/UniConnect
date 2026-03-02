/**
 * app/solicitud/[id].tsx
 * Detalle de una solicitud de estudio — US-009 (vista previa)
 *
 * Muestra información completa de la solicitud:
 * - Autor con avatar grande e iniciales
 * - Materia, facultad, modalidad
 * - Cupos disponibles
 * - Descripción completa
 * - Botón "Postularme" (si no es el propio post)
 */

import { Colors } from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Tipo de datos que necesita esta pantalla ──────────────────────────────────
interface RequestDetail {
  id: string;
  author_id: string;
  title: string;
  description: string;
  modality: string;
  max_members: number;
  status: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  author_bio?: string;
  subject_name: string;
  faculty_name: string;
}

const MODALITY_LABEL: Record<string, string> = {
  presencial: "📍 Presencial",
  virtual: "💻 Virtual",
  hibrido: "🔄 Híbrido",
  híbrido: "🔄 Híbrido",
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SolicitudDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Cargar detalle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("study_requests")
          .select(`
            id, author_id, title, description, modality,
            max_members, status, created_at,
            profiles ( full_name, avatar_url, bio ),
            subjects (
              name,
              program_subjects (
                programs (
                  faculties ( name )
                )
              )
            )
          `)
          .eq("id", id)
          .single();

        if (err) throw err;
        if (!data) throw new Error("Solicitud no encontrada.");

        const r = data as any;

        // Extraer facultad desde la cadena de joins
        let facultyName = "Sin facultad";
        const psArr: any[] = r.subjects?.program_subjects ?? [];
        if (psArr.length > 0) {
          const prog = Array.isArray(psArr[0]?.programs)
            ? psArr[0].programs[0]
            : psArr[0]?.programs;
          const fac = Array.isArray(prog?.faculties)
            ? prog.faculties[0]
            : prog?.faculties;
          if (fac?.name) facultyName = fac.name;
        }

        setRequest({
          id: r.id,
          author_id: r.author_id,
          title: r.title,
          description: r.description,
          modality: r.modality,
          max_members: r.max_members,
          status: r.status,
          created_at: r.created_at,
          author_name: r.profiles?.full_name ?? "Usuario",
          author_avatar: r.profiles?.avatar_url ?? undefined,
          author_bio: r.profiles?.bio ?? undefined,
          subject_name: r.subjects?.name ?? "Sin materia",
          faculty_name: facultyName,
        });
      } catch (e: any) {
        setError(e.message ?? "Error al cargar la solicitud.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const isOwnPost = request?.author_id === user?.id;

  // ── Estados de carga / error ────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[styles.centered, { backgroundColor: C.background }]}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
        <Text style={[styles.errorText, { color: C.textPrimary }]}>
          {error ?? "Solicitud no encontrada"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: C.primary }]}
        >
          <Text style={{ color: C.textOnPrimary, fontWeight: "600" }}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render principal ────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* ── Barra superior con botón volver ─────────────────────────────── */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8, borderBottomColor: C.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backIconBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          activeOpacity={0.75}
        >
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: C.textPrimary }]} numberOfLines={1}>
          Solicitud de estudio
        </Text>
        {/* Espacio simétrico al botón volver */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tarjeta del autor ─────────────────────────────────────────── */}
        <View style={[styles.authorCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          {/* Avatar grande */}
          <View style={[styles.avatarLarge, { backgroundColor: C.primary + "20" }]}>
            <Text style={[styles.avatarInitials, { color: C.primary }]}>
              {getInitials(request.author_name)}
            </Text>
          </View>

          <Text style={[styles.authorName, { color: C.textPrimary }]}>
            {request.author_name}
          </Text>

          {request.author_bio ? (
            <Text style={[styles.authorBio, { color: C.textSecondary }]}>
              {request.author_bio}
            </Text>
          ) : null}

          <Text style={[styles.authorTime, { color: C.textPlaceholder }]}>
            Publicado {getTimeAgo(request.created_at)}
          </Text>
        </View>

        {/* ── Chips de metadatos ────────────────────────────────────────── */}
        <View style={styles.metaRow}>
          {/* Materia */}
          <View style={[styles.metaChip, { backgroundColor: C.primary + "15", borderColor: C.primary + "30" }]}>
            <Text style={[styles.metaChipText, { color: C.primary }]}>
              📚 {request.subject_name}
            </Text>
          </View>
          {/* Facultad */}
          <View style={[styles.metaChip, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.metaChipText, { color: C.textSecondary }]}>
              🏛 {request.faculty_name}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {/* Modalidad */}
          <View style={[styles.metaChip, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.metaChipText, { color: C.textSecondary }]}>
              {MODALITY_LABEL[request.modality] ?? request.modality}
            </Text>
          </View>
          {/* Cupos */}
          <View style={[
            styles.metaChip,
            {
              backgroundColor:
                request.status === "abierta" ? C.success + "15" : C.border,
              borderColor:
                request.status === "abierta" ? C.success + "40" : C.border,
            },
          ]}>
            <Text style={[
              styles.metaChipText,
              { color: request.status === "abierta" ? C.success : C.textSecondary },
            ]}>
              👥 {request.max_members} cupos · {request.status}
            </Text>
          </View>
        </View>

        {/* ── Título ───────────────────────────────────────────────────── */}
        <View style={[styles.section, { borderColor: C.border }]}>
          <Text style={[styles.sectionLabel, { color: C.textPlaceholder }]}>
            TÍTULO
          </Text>
          <Text style={[styles.titleText, { color: C.textPrimary }]}>
            {request.title}
          </Text>
        </View>

        {/* ── Descripción ───────────────────────────────────────────────── */}
        <View style={[styles.section, { borderColor: C.border }]}>
          <Text style={[styles.sectionLabel, { color: C.textPlaceholder }]}>
            DESCRIPCIÓN
          </Text>
          <Text style={[styles.descText, { color: C.textPrimary }]}>
            {request.description}
          </Text>
        </View>
      </ScrollView>

      {/* ── Botón flotante de acción ─────────────────────────────────────── */}
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: C.background,
            borderTopColor: C.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {isOwnPost ? (
          <View style={[styles.ownPostBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.ownPostText, { color: C.textSecondary }]}>
              ✏️ Esta es tu solicitud
            </Text>
          </View>
        ) : request.status === "abierta" ? (
          <TouchableOpacity
            style={[styles.postulateBtn, { backgroundColor: C.primary }]}
            onPress={() => router.push(`/postular/${request.id}` as any)}
            activeOpacity={0.85}
          >
            <Text style={[styles.postulateBtnText, { color: C.textOnPrimary }]}>
              Postularme a este grupo
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.closedBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.closedText, { color: C.textSecondary }]}>
              🔒 Esta solicitud ya está cerrada
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, lineHeight: 24 },
  topBarTitle: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  // Autor
  authorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInitials: { fontSize: 26, fontWeight: "800" },
  authorName: { fontSize: 18, fontWeight: "700" },
  authorBio: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  authorTime: { fontSize: 12, marginTop: 2 },

  // Chips de metadatos
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaChipText: { fontSize: 13, fontWeight: "500" },

  // Secciones de texto
  section: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
  },
  descText: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Barra flotante inferior
  floatingBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  postulateBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  postulateBtnText: { fontSize: 16, fontWeight: "700" },
  ownPostBanner: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  ownPostText: { fontSize: 14, fontWeight: "600" },
  closedBanner: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  closedText: { fontSize: 14, fontWeight: "600" },
});