/**
 * app/solicitud/[id].tsx
 * Detalle de una solicitud de estudio — US-009 (vista previa)
 *
 * - Autor con avatar grande e iniciales
 * - Materia y facultad
 * - Cupos disponibles
 * - Descripción completa
 * - Botón "Postularme" (si no es el propio post)
 */

import { Colors } from "@/constants/Colors";
import { useRequestDetail } from "@/hooks/application/useRequestDetail";
import { useMessaging } from "@/hooks/application/useMessaging";
import type { Application } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { getOrCreateConversation } = useMessaging();
  const [chatLoading, setChatLoading] = useState(false);
  const {
    user,
    request,
    loading,
    error,
    reviewingApplicationId,
    isSavingDescription,
    isEditingDescription,
    setIsEditingDescription,
    descriptionDraft,
    setDescriptionDraft,
    updatingAdminUserId,
    cancelingAction,
    applicationStatus,
    isOwnPost,
    canManageRequest,
    acceptedMembers,
    pendingApplications,
    occupiedSlots,
    remainingSlots,
    isExtraAdmin,
    handleUpdateDescription,
    handleSetAdmin,
    handleCancelRequest,
    handleCancelMyApplication,
    handleReviewApplication,
  } = useRequestDetail({
    requestId: id,
    onRequestCanceled: () => router.replace("/(tabs)/invitaciones" as any),
  });

  const openChat = async () => {
    if (!user || !request) return;
    setChatLoading(true);
    try {
      const conversation = await getOrCreateConversation(user.id, request.author_id);
      router.push(`/chat/${conversation.id}?otherUserName=${encodeURIComponent(request.author_name)}` as any);
    } catch (e: any) {
      console.error("Error abriendo chat:", e.message);
      Alert.alert("Error", e.message ?? "No se pudo abrir el chat.");
    } finally {
      setChatLoading(false);
    }
  };

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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 260 }]}
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
              👥 {remainingSlots} cupos disponibles · {request.status}
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

          {isEditingDescription ? (
            <View style={styles.editorWrap}>
              <TextInput
                value={descriptionDraft}
                onChangeText={setDescriptionDraft}
                multiline
                style={[
                  styles.descInput,
                  { color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface },
                ]}
                placeholder="Escribe una descripcion clara para el grupo..."
                placeholderTextColor={C.textPlaceholder}
              />
              <View style={styles.editorActions}>
                <TouchableOpacity
                  style={[styles.editBtn, styles.ghostBtn, { borderColor: C.border }]}
                  onPress={() => {
                    setDescriptionDraft(request.description);
                    setIsEditingDescription(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.editBtnText, { color: C.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: isSavingDescription ? C.border : C.primary }]}
                  onPress={handleUpdateDescription}
                  disabled={isSavingDescription}
                  activeOpacity={0.85}
                >
                  {isSavingDescription ? (
                    <ActivityIndicator size="small" color={C.textOnPrimary} />
                  ) : (
                    <Text style={[styles.editBtnText, { color: C.textOnPrimary }]}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.descText, { color: C.textPrimary }]}>
                {request.description}
              </Text>
              {canManageRequest && (
                <TouchableOpacity
                  style={[styles.inlineActionBtn, { borderColor: C.border }]}
                  onPress={() => setIsEditingDescription(true)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.inlineActionText, { color: C.textSecondary }]}>✏️ Editar descripcion</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={[styles.section, { borderColor: C.border }]}>
          <Text style={[styles.sectionLabel, { color: C.textPlaceholder }]}>INTEGRANTES</Text>

          <View style={[styles.counterWrap, { backgroundColor: C.primary + "12", borderColor: C.primary + "35" }]}> 
            <Text style={[styles.counterText, { color: C.primary }]}> 
              Integrantes: {occupiedSlots}/{request.max_members}
            </Text>
          </View>

          <View style={[styles.memberCard, { backgroundColor: C.surface, borderColor: C.border }]}> 
            <View style={[styles.memberAvatar, { backgroundColor: C.primary + "20" }]}> 
              <Text style={[styles.memberAvatarText, { color: C.primary }]}>
                {getInitials(request.author_name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.memberName, { color: C.textPrimary }]}>{request.author_name}</Text>
              <Text style={[styles.memberRole, { color: C.primary }]}>Creador · Administrador</Text>
            </View>
          </View>

          {acceptedMembers.map((member) => {
            const name = member.profiles?.full_name ?? "Integrante";
            return (
              <View
                key={member.id}
                style={[styles.memberCard, { backgroundColor: C.surface, borderColor: C.border }]}
              >
                <View style={[styles.memberAvatar, { backgroundColor: C.success + "20" }]}> 
                  <Text style={[styles.memberAvatarText, { color: C.success }]}>{getInitials(name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: C.textPrimary }]}>{name}</Text>
                  <Text style={[styles.memberRole, { color: isExtraAdmin(member.applicant_id) ? C.primary : C.success }]}>
                    {isExtraAdmin(member.applicant_id) ? "Administrador" : "Participante aceptado"}
                  </Text>
                </View>

                {canManageRequest && (
                  <TouchableOpacity
                    style={[
                      styles.adminToggleBtn,
                      {
                        borderColor: isExtraAdmin(member.applicant_id) ? C.error : C.primary,
                        backgroundColor: C.surface,
                        opacity: updatingAdminUserId === member.applicant_id ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => handleSetAdmin(member.applicant_id, !isExtraAdmin(member.applicant_id))}
                    disabled={updatingAdminUserId === member.applicant_id}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.adminToggleText,
                        { color: isExtraAdmin(member.applicant_id) ? C.error : C.primary },
                      ]}
                    >
                      {isExtraAdmin(member.applicant_id) ? "Quitar admin" : "Hacer admin"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {canManageRequest && (
          <View style={[styles.section, { borderColor: C.border }]}>
            <Text style={[styles.sectionLabel, { color: C.textPlaceholder }]}>SOLICITUDES PENDIENTES</Text>

            {pendingApplications.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: C.border }]}> 
                <Text style={[styles.emptyText, { color: C.textSecondary }]}>No hay solicitudes pendientes.</Text>
              </View>
            ) : (
              pendingApplications.map((app) => {
                const name = app.profiles?.full_name ?? "Estudiante";
                const loadingAction = reviewingApplicationId === app.id;
                return (
                  <View
                    key={app.id}
                    style={[styles.pendingCard, { backgroundColor: C.surface, borderColor: C.border }]}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: C.primary + "20" }]}> 
                      <Text style={[styles.memberAvatarText, { color: C.primary }]}>{getInitials(name)}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <TouchableOpacity
                        onPress={() => router.push(`/perfil-estudiante/${app.applicant_id}` as any)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.memberName, styles.profileLink, { color: C.textPrimary }]}>{name}</Text>
                      </TouchableOpacity>
                      <Text style={[styles.pendingMessage, { color: C.textSecondary }]} numberOfLines={2}>
                        &quot;{app.message}&quot;
                      </Text>
                    </View>

                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={[styles.smallActionBtn, styles.rejectBtn, { borderColor: C.error }]}
                        onPress={() => handleReviewApplication(app.id, "rechazada")}
                        disabled={loadingAction}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.smallActionText, { color: C.error }]}>Rechazar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.smallActionBtn, { backgroundColor: loadingAction ? C.border : C.success }]}
                        onPress={() => handleReviewApplication(app.id, "aceptada")}
                        disabled={loadingAction}
                        activeOpacity={0.85}
                      >
                        {loadingAction ? (
                          <ActivityIndicator size="small" color={C.textOnPrimary} />
                        ) : (
                          <Text style={[styles.smallActionText, { color: C.textOnPrimary }]}>✅ Aceptar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
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
          <View style={{ gap: 8 }}>
            <View style={[styles.ownPostBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.ownPostText, { color: C.textSecondary }]}>✏️ Esta es tu solicitud</Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
              onPress={handleCancelRequest}
              disabled={cancelingAction}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryDangerText, { color: C.error }]}>Cancelar solicitud</Text>
            </TouchableOpacity>
          </View>

        ) : canManageRequest ? (
          <View style={{ gap: 8 }}>
            <View style={[styles.ownPostBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.ownPostText, { color: C.textSecondary }]}>🛠 Eres administrador de esta solicitud</Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
              onPress={handleCancelRequest}
              disabled={cancelingAction}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryDangerText, { color: C.error }]}>Cancelar solicitud</Text>
            </TouchableOpacity>
          </View>

        ) : applicationStatus === "aceptada" ? (
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.postulateBtn,
                { backgroundColor: chatLoading ? C.border : C.primary },
              ]}
              onPress={openChat}
              disabled={chatLoading}
              activeOpacity={0.85}
            >
              <Text style={[styles.postulateBtnText, { color: C.textOnPrimary }]}> 
                {chatLoading ? "Abriendo chat..." : `💬 Mensaje a ${request.author_name.split(" ")[0]}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
              onPress={handleCancelMyApplication}
              disabled={cancelingAction}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryDangerText, { color: C.error }]}>Salir del grupo</Text>
            </TouchableOpacity>
          </View>

        ) : applicationStatus === "pendiente" ? (
          <View style={{ gap: 8 }}>
            <View style={[styles.ownPostBanner, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.ownPostText, { color: C.textSecondary }]}>⏳ Tu postulación está en revisión</Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryDangerBtn, { borderColor: C.error }]}
              onPress={handleCancelMyApplication}
              disabled={cancelingAction}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryDangerText, { color: C.error }]}>Retirar postulación</Text>
            </TouchableOpacity>
          </View>

        ) : applicationStatus === "rechazada" ? (
          // ❌ Rechazada
          <View style={[styles.closedBanner, { backgroundColor: C.surface, borderColor: C.error + "40" }]}>
            <Text style={[styles.closedText, { color: C.error }]}>
              ❌ Tu postulación fue rechazada
            </Text>
          </View>

        ) : request.status === "abierta" ? (
          // Sin postulación aún → puede postularse
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
          // Solicitud cerrada, sin relación
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

  memberCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  counterWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  counterText: {
    fontSize: 13,
    fontWeight: "700",
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
  },
  memberRole: {
    fontSize: 12,
    marginTop: 1,
  },
  adminToggleBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  adminToggleText: {
    fontSize: 12,
    fontWeight: "700",
  },

  emptyBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
  },

  pendingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginTop: 8,
  },
  profileLink: {
    textDecorationLine: "underline",
  },
  pendingMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    fontStyle: "italic",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 8,
  },
  rejectBtn: {
    borderWidth: 1,
  },
  smallActionText: {
    fontSize: 13,
    fontWeight: "700",
  },

  editorWrap: {
    gap: 10,
  },
  descInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontSize: 14,
    lineHeight: 20,
  },
  editorActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtn: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  inlineActionBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineActionText: {
    fontSize: 12,
    fontWeight: "700",
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
  secondaryDangerBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryDangerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  closedBanner: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  closedText: { fontSize: 14, fontWeight: "600" },
});