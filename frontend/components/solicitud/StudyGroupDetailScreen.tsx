/**
 * components/solicitud/StudyGroupDetailScreen.tsx
 * Vista detalle de grupo de estudio con logica compartida.
 */

import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { MemberChatView } from "@/components/dashboard/MemberChatView";
import { RequestDetailActionBar } from "@/components/solicitud/RequestDetailActionBar";
import { RequestDetailContent } from "@/components/solicitud/RequestDetailContent";
import { Colors } from "@/constants/Colors";
import { useRequestDetail } from "@/hooks/application/useRequestDetail";
import { useMessaging } from "@/hooks/application/useMessaging";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StudyGroupDetailScreenProps {
  requestId?: string;
}

export function StudyGroupDetailScreen({ requestId }: StudyGroupDetailScreenProps) {
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
    requestId,
    onRequestCanceled: () => router.replace("/(tabs)/invitaciones" as any),
  });

  if (Platform.OS === "web" && request?.id) {
    // Si es administrador, mostrar dashboard completo
    if (canManageRequest) {
      return <AdminDashboardLayout requestId={request.id} />;
    }
    // Si es miembro aceptado, mostrar solo chat grupal
    else if (applicationStatus === "aceptada") {
      const groupSubtitle = request.subject_name
        ? request.faculty_name
          ? `${request.subject_name} · ${request.faculty_name}`
          : request.subject_name
        : request.faculty_name ?? "Sin materia";

      return (
        <MemberChatView
          requestId={request.id}
          groupTitle={request.title ?? "Grupo de estudio"}
          groupSubtitle={groupSubtitle}
        />
      );
    }
  }

  const openChatWith = async (targetUserId: string, targetUserName: string) => {
    if (!user?.id || !targetUserId || targetUserId === user.id) return;

    setChatLoading(true);
    try {
      const conversation = await getOrCreateConversation(user.id, targetUserId);
      router.push(`/chat/${conversation.id}?otherUserName=${encodeURIComponent(targetUserName)}` as any);
    } catch (e: any) {
      console.error("Error abriendo chat:", e.message);
      Alert.alert("Error", e.message ?? "No se pudo abrir el chat.");
    } finally {
      setChatLoading(false);
    }
  };

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

  const openPostulate = (requestIdValue: string) => {
    router.push(`/postular/${requestIdValue}` as any);
  };

  const openApplicantProfile = (applicantId: string) => {
    router.push(`/perfil-estudiante/${applicantId}` as any);
  };

  const cancelDescriptionEdit = () => {
    if (!request) return;
    setDescriptionDraft(request.description);
    setIsEditingDescription(false);
  };

  if (!requestId) {
    return (
      <View style={[styles.centered, { backgroundColor: C.background }]}> 
        <Text style={[styles.errorText, { color: C.textPrimary }]}>Solicitud no encontrada.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: C.primary }]}
        >
          <Text style={{ color: C.textOnPrimary, fontWeight: "600" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <Text style={{ color: C.textOnPrimary, fontWeight: "600" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}> 
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

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
        <View style={{ width: 40 }} />
      </View>

      <RequestDetailContent
        C={C}
        request={request}
        currentUserId={user?.id}
        chatLoading={chatLoading}
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
        onOpenMemberChat={openChatWith}
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  backBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 18, fontWeight: "700" },
  topBarTitle: { fontSize: 16, fontWeight: "700" },
});
