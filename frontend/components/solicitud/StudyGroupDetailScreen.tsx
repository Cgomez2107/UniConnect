/**
 * components/solicitud/StudyGroupDetailScreen.tsx
 * Vista detalle de grupo de estudio con logica compartida.
 */

import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { RequestDetailActionBar } from "@/components/solicitud/RequestDetailActionBar";
import { RequestDetailContent } from "@/components/solicitud/RequestDetailContent";
import { ChatInput } from "@/components/chat/ChatInput";
import { Colors } from "@/constants/Colors";
import { useRequestDetail } from "@/hooks/application/useRequestDetail";
import { useMessaging } from "@/hooks/application/useMessaging";
import { useStudyGroupDashboard } from "@/hooks/useStudyGroupDashboard";
import { supabase } from "@/lib/supabase";
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

  const { messages, sendingMessage, handleSendMessage } = useStudyGroupDashboard({
    requestId: request?.id ?? requestId,
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

  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  const handleSend = useCallback(() => {
    if (!messageDraft.trim() && !pendingMedia) return;
    handleSendMessage(messageDraft.trim(), undefined, pendingMedia || undefined);
    setMessageDraft("");
    setPendingMedia(null);
    setMediaPreviewUri(null);
  }, [handleSendMessage, messageDraft, pendingMedia]);

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

  const handleTransferAdmin = useCallback(() => {
    Alert.alert(
      "Transferir admin",
      "Selecciona un miembro desde la lista para transferir los privilegios.",
    );
  }, []);

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
          }}
          activeOpacity={0.75}
        >
          <Text style={{ color: "#111827", fontSize: 18, fontWeight: "700" }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: "#111827", fontSize: 18, fontWeight: "700" }} numberOfLines={1}>
          {groupTitle}
        </Text>
        <View style={{ width: 40 }} />
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

          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
            <ChatInput
              text={{
                value: messageDraft,
                onChangeText: setMessageDraft,
                onTyping: () => undefined,
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
                onPress={handleTransferAdmin}
                className="items-center rounded-xl border border-primary bg-blue-50 p-4"
                activeOpacity={0.85}
              >
                <Text className="font-semibold" style={{ color: C.primary }}>
                  Transferir admin
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
    </View>
  );
}

export default StudyGroupDetailScreen;
