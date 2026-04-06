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
import { RequestDetailActionBar } from "@/components/solicitud/RequestDetailActionBar";
import { RequestDetailContent } from "@/components/solicitud/RequestDetailContent";
import { useRequestDetail } from "@/hooks/application/useRequestDetail";
import { useMessaging } from "@/hooks/application/useMessaging";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  const openPostulate = (requestId: string) => {
    router.push(`/postular/${requestId}` as any);
  };

  const openApplicantProfile = (applicantId: string) => {
    router.push(`/perfil-estudiante/${applicantId}` as any);
  };

  const cancelDescriptionEdit = () => {
    if (!request) return;
    setDescriptionDraft(request.description);
    setIsEditingDescription(false);
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

      <RequestDetailContent
        C={C}
        request={request}
        insetsBottom={insets.bottom}
        canManageRequest={canManageRequest}
        isEditingDescription={isEditingDescription}
        setIsEditingDescription={setIsEditingDescription}
        descriptionDraft={descriptionDraft}
        setDescriptionDraft={setDescriptionDraft}
        isSavingDescription={isSavingDescription}
        onSaveDescription={handleUpdateDescription}
        onCancelDescriptionEdit={cancelDescriptionEdit}
        occupiedSlots={occupiedSlots}
        remainingSlots={remainingSlots}
        acceptedMembers={acceptedMembers}
        pendingApplications={pendingApplications}
        reviewingApplicationId={reviewingApplicationId}
        updatingAdminUserId={updatingAdminUserId}
        isExtraAdmin={isExtraAdmin}
        onSetAdmin={handleSetAdmin}
        onReviewApplication={handleReviewApplication}
        onOpenApplicantProfile={openApplicantProfile}
      />

      <RequestDetailActionBar
        C={C}
        insetsBottom={insets.bottom}
        isOwnPost={isOwnPost}
        canManageRequest={canManageRequest}
        applicationStatus={applicationStatus}
        requestStatus={request.status}
        requestId={request.id}
        requestAuthorName={request.author_name}
        chatLoading={chatLoading}
        cancelingAction={cancelingAction}
        onOpenChat={openChat}
        onCancelRequest={handleCancelRequest}
        onCancelMyApplication={handleCancelMyApplication}
        onOpenPostulate={openPostulate}
      />
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  centered: {
    flex: 1,
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