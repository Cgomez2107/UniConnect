/**
 * components/solicitud/StudyGroupDetailScreen.tsx
 * Vista detalle de grupo de estudio con logica compartida.
 */

import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { RequestDetailActionBar } from "@/components/solicitud/RequestDetailActionBar";
import { RequestDetailContent } from "@/components/solicitud/RequestDetailContent";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessageValidation } from "@/hooks/useMessageValidation";
import { GroupContext } from "@/lib/patterns/state";
import { GroupStateBadge } from "@/components/groups/GroupStateBadge";
import { Colors } from "@/constants/Colors";
import { useRequestDetail } from "@/hooks/application/useRequestDetail";
import { useMessaging } from "@/hooks/application/useMessaging";
import { useStudyGroupDashboard } from "@/hooks/useStudyGroupDashboard";
import { supabase } from "@/lib/supabase";
import type { StudyGroupMember } from "@/types/adminDashboard";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StudyGroupDetailScreenProps {
  requestId?: string;
}

type DetailTab = "chat" | "admin";

interface TransferMember {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
}

export function StudyGroupDetailScreen({ requestId }: StudyGroupDetailScreenProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { getOrCreateConversation } = useMessaging();
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("chat");
  const [messageDraft, setMessageDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [mediaPreviewUri, setMediaPreviewUri] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: string; filename: string } | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringTo, setTransferringTo] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<{userId: string; displayName: string}[]>([]);
  const [transferAcceptedState, setTransferAcceptedState] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

  const { members, messages, sendingMessage, handleSendMessage, requestAdminTransfer } =
    useStudyGroupDashboard({
      requestId: request?.id ?? requestId,
    });

  const { validationState, validateMessage, clearValidation } = useMessageValidation({
    maxLength: 1000,
    debounceMs: 300,
  });

  const isPrimaryAdmin = Boolean(user?.id && request?.author_id === user.id);
  const adminTabLabel = isPrimaryAdmin ? "Administracion" : "Info";
  const canAccessChat = canManageRequest || applicationStatus === "aceptada";
  const currentUserId = user?.id ?? "";

  useEffect(() => {
    if (!canAccessChat && activeTab === "chat") {
      setActiveTab("admin");
    }
  }, [canAccessChat, activeTab]);

  const groupTitle = useMemo(() => request?.title ?? "Grupo de estudio", [request?.title]);

  const groupState = useMemo(() => {
    if (transferAcceptedState) return "TransferenciaAceptada";
    if (request?.status === "cerrada") return "Disuelto";
    if (request?.status === "expirada") return "Bloqueado";
    if (request?.hasPendingTransfer) return "PendienteTransferencia";
    return "Activo";
  }, [request?.status, request?.hasPendingTransfer, transferAcceptedState]);

  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  const handleSend = useCallback(async () => {
    if (!messageDraft.trim() && !pendingMedia) return;

    // Validar localmente (ej: longitud)
    const state = await validateMessage(messageDraft);
    if (!state.isValid) {
      return;
    }

    const finalMentions = selectedMentions.filter(m =>
      messageDraft.includes(`@${m.displayName}`)
    );
    const success = await handleSendMessage(messageDraft.trim(), finalMentions, pendingMedia || undefined);
    if (success) {
      setMessageDraft("");
      setSelectedMentions([]);
      setPendingMedia(null);
      setMediaPreviewUri(null);
      clearValidation();
    }
  }, [handleSendMessage, messageDraft, pendingMedia, selectedMentions, validateMessage, clearValidation]);

  const handleInputChange = useCallback((text: string) => {
    setMessageDraft(text);
    const lastWord = text.split(" ").pop() || "";
    if (lastWord.startsWith("@")) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
    void validateMessage(text);
  }, [validateMessage]);

  const insertMention = useCallback((member: StudyGroupMember) => {
    const words = messageDraft.split(" ");
    words.pop();
    const name = member.fullName || "Integrante";
    setMessageDraft([...words, `@${name} `].join(" "));
    setShowMentions(false);
    if (!selectedMentions.some(m => m.userId === member.userId)) {
      setSelectedMentions([...selectedMentions, { userId: member.userId, displayName: name }]);
    }
  }, [messageDraft, selectedMentions]);

  const handlePickMedia = useCallback(async () => {
    if (!user?.id) return;
    setUploadingFile(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      setMediaPreviewUri(file.uri);

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const path = `${user.id}/chat/${fileName}`;

      const expoFile = new File(file.uri);
      const arrayBuffer = await expoFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(path, arrayBuffer, {
          contentType: file.mimeType ?? "application/octet-stream",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resources")
        .getPublicUrl(path);

      setPendingMedia({
        url: publicUrl,
        type: file.mimeType ?? "application/octet-stream",
        filename: file.name,
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      Alert.alert("Error", "No se pudo subir el archivo. Inténtalo de nuevo.");
      setMediaPreviewUri(null);
      setPendingMedia(null);
    } finally {
      setUploadingFile(false);
    }
  }, [user?.id]);

  const handleOpenTransferModal = useCallback(() => {
    setShowTransferModal(true);
  }, []);

  const handleSelectTransferTarget = useCallback(
    async (targetUserId: string) => {
      setShowTransferModal(false);
      setTransferringTo(targetUserId);
      try {
        const ctx = new GroupContext(
          request?.id ?? requestId ?? "",
          groupTitle,
          user?.id ?? "",
        );
        await ctx.requestAdminTransfer(targetUserId);
        ctx.subscribe((event) => {
          if (event.type === "ADMIN_TRANSFER_REQUESTED") {
            requestAdminTransfer(targetUserId);
          }
        });
      } catch (err) {
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "No se pudo iniciar la transferencia.",
        );
      } finally {
        setTransferringTo(null);
      }
    },
    [request?.id, requestId, groupTitle, user?.id, requestAdminTransfer],
  );

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
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: C.background }}>
        <Text className="text-base font-semibold text-center" style={{ color: C.textPrimary }}>
          Solicitud no encontrada.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 rounded-xl px-4 py-2"
          style={{ backgroundColor: C.primary }}
        >
          <Text style={{ color: C.textOnPrimary, fontWeight: "600" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: C.background }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: C.background }}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
        <Text className="text-base font-semibold text-center" style={{ color: C.textPrimary }}>
          {error ?? "Solicitud no encontrada"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 rounded-xl px-4 py-2"
          style={{ backgroundColor: C.primary }}
        >
          <Text style={{ color: C.textOnPrimary, fontWeight: "600" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#f3f4f6",
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          activeOpacity={0.75}
        >
          <Text style={{ color: "#111827", fontSize: 18, fontWeight: "700" }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: "#111827", fontSize: 18, fontWeight: "700" }} numberOfLines={1}>
            {groupTitle}
          </Text>
        </View>
        <GroupStateBadge state={groupState} size="small" />
      </View>

      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("chat")}
          disabled={!canAccessChat}
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: activeTab === "chat" ? 2 : 0,
            borderBottomColor: C.primary,
          }}
        >
          <Text style={{ color: activeTab === "chat" ? "#111827" : "#9ca3af", fontSize: 14, fontWeight: "600" }}>
            Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("admin")}
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: activeTab === "admin" ? 2 : 0,
            borderBottomColor: C.primary,
          }}
        >
          <Text style={{ color: activeTab === "admin" ? "#111827" : "#9ca3af", fontSize: 14, fontWeight: "600" }}>
            {adminTabLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "chat" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => (item.id ? String(item.id) : `msg-${index}`)}
            renderItem={({ item }) => {
              const isOwn = item.senderId === currentUserId;
              const senderName = item.senderFullName ?? "Integrante";
              return (
                <View style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
                  {!isOwn && (
                    <Text style={{ color: "#e5e7eb", fontSize: 12, fontWeight: "700", marginBottom: 4 }}>
                      {senderName}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: isOwn ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      gap: 8,
                    }}
                  >
                    {!isOwn && (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#374151",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#ffffff" }}>
                          {senderName.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        maxWidth: "78%",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        borderBottomLeftRadius: isOwn ? 16 : 4,
                        borderBottomRightRadius: isOwn ? 4 : 16,
                        alignSelf: isOwn ? "flex-end" : "flex-start",
                        backgroundColor: isOwn ? C.primary : "#f3f4f6",
                      }}
                    >
                      {item.content ? (
                        <Text style={{ fontSize: 14, color: isOwn ? "#ffffff" : "#111827" }}>
                          {item.content}
                        </Text>
                      ) : null}

                      {item.media_url && item.media_type?.startsWith("image/") ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(item.media_url!)}
                          style={{ marginTop: item.content ? 8 : 0 }}
                          activeOpacity={0.85}
                        >
                          <Image
                            source={{ uri: item.media_url }}
                            style={{
                              width: 200,
                              height: 200,
                              borderRadius: 12,
                              backgroundColor: "#e5e7eb",
                            }}
                            resizeMode="cover"
                          />
                          <Text
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: isOwn ? "rgba(255,255,255,0.7)" : "#6b7280",
                              textAlign: "right",
                            }}
                          >
                            Toca para ampliar
                          </Text>
                        </TouchableOpacity>
                      ) : item.media_url ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(item.media_url!)}
                          style={{
                            marginTop: item.content ? 8 : 0,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            backgroundColor: isOwn ? "rgba(255,255,255,0.12)" : "#e5e7eb",
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 12,
                          }}
                          activeOpacity={0.75}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              backgroundColor: isOwn ? "rgba(255,255,255,0.18)" : "#d1d5db",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ fontSize: 16 }}>📄</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: isOwn ? "#ffffff" : "#111827",
                              }}
                              numberOfLines={1}
                            >
                              {item.media_filename || "Archivo adjunto"}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: isOwn ? "rgba(255,255,255,0.65)" : "#6b7280",
                                marginTop: 1,
                              }}
                            >
                              Toca para abrir
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}

                      <Text style={{ marginTop: 4, fontSize: 12, color: isOwn ? "rgba(255,255,255,0.7)" : "#6b7280" }}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={{ paddingVertical: 10, paddingBottom: insets.bottom + 180 }}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 20, backgroundColor: C.surface }}>
                <Text style={{ fontSize: 14, color: C.textPlaceholder }}>
                  Aun no hay mensajes en este grupo.
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          {showMentions && members.length > 0 && (
            <View style={{
              position: "absolute",
              bottom: 56,
              left: 12,
              right: 12,
              backgroundColor: C.surface,
              borderRadius: 12,
              maxHeight: 200,
              borderWidth: 1,
              borderColor: C.border,
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              zIndex: 100,
            }}>
              <FlatList
                data={members.filter(m => {
                  if (!mentionQuery) return true;
                  return (m.fullName || "").toLowerCase().includes(mentionQuery);
                })}
                keyExtractor={item => item.userId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => insertMention(item)}
                    style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 10 }}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: C.primary + "30",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ color: C.primary, fontWeight: "700", fontSize: 12 }}>
                        {(item.fullName || "?").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ color: C.textPrimary, fontWeight: "500", fontSize: 14, flex: 1 }}>
                      {item.fullName || "Integrante"}
                    </Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            </View>
          )}

          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
            <ChatInput
              text={{
                value: messageDraft,
                onChangeText: handleInputChange,
                onTyping: handleInputChange,
              }}
              reply={{ preview: null, onClear: () => undefined }}
              media={{
                previewUri: mediaPreviewUri,
                picking: uploadingFile,
                onPick: handlePickMedia,
                onRemove: () => {
                  setMediaPreviewUri(null);
                  setPendingMedia(null);
                },
              }}
              send={{ sending: sendingMessage || uploadingFile, onSend: handleSend }}
              voice={{ recording: false, elapsedSec: 0, onPress: () => undefined }}
              validationState={validationState}
              backgroundColorOverride="#ffffff"
              borderTopColorOverride="#e5e7eb"
              paddingBottomOverride={insets.bottom + 12}
            />
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1">
          <RequestDetailContent
            C={C}
            request={request}
            currentUserId={user?.id}
            chatLoading={chatLoading}
            insetsBottom={insets.bottom}
            canManageRequest={isPrimaryAdmin}
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

          {isPrimaryAdmin ? (
            <View className="mt-6 gap-4 px-4">
              <TouchableOpacity
                onPress={handleOpenTransferModal}
                className="items-center rounded-xl border border-primary bg-blue-50 p-4"
                disabled={transferringTo !== null}
                activeOpacity={0.85}
              >
                <Text className="font-semibold" style={{ color: C.primary }}>
                  {transferringTo ? "Transfiriendo..." : "Transferir admin"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelRequest}
                className="items-center rounded-xl bg-red-500 p-4"
                activeOpacity={0.85}
              >
                <Text className="font-bold text-white">Disolver grupo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {isPrimaryAdmin ? (
            <RequestDetailActionBar
              C={C}
              insetsBottom={insets.bottom}
              isOwnPost={isOwnPost}
              canManageRequest={isPrimaryAdmin}
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
          ) : null}
        </View>
      )}

      <Modal
        visible={showTransferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: C.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: "60%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.textPrimary, marginBottom: 16 }}>
              Seleccionar nuevo administrador
            </Text>
            <FlatList
              data={members.filter((m) => m.userId !== request?.author_id && m.userId !== user?.id)}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectTransferTarget(item.userId)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: C.surface,
                    marginBottom: 8,
                    gap: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: C.primary + "30",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: C.primary, fontWeight: "700", fontSize: 16 }}>
                      {(item.fullName ?? "?").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: C.textPrimary, fontWeight: "600", fontSize: 15, flex: 1 }}>
                    {item.fullName ?? "Integrante"}
                  </Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12, textTransform: "capitalize" }}>
                    {item.role === "autor" ? "Creador" : item.role === "admin" ? "Admin" : "Miembro"}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: C.textSecondary, textAlign: "center", paddingVertical: 20 }}>
                  No hay otros miembros disponibles.
                </Text>
              }
            />
            <TouchableOpacity
              onPress={() => setShowTransferModal(false)}
              style={{
                marginTop: 12,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: C.surface,
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: C.error, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default StudyGroupDetailScreen;
