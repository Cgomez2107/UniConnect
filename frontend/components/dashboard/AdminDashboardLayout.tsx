import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useStudyGroupDashboard } from "@/hooks/useStudyGroupDashboard";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { useMessaging } from "@/hooks/application/useMessaging";
import type { StudyGroupMember, GroupMessage } from "@/types/adminDashboard";
import { fetchApi } from "@/lib/api/httpClient";
import { transformRawMessage } from "@/chat/utils/messageFactory";
import { supabase } from "@/lib/supabase";
import { useNotificationStore } from "@/store/useNotificationStore";
import { getGroupPermissions } from "@/components/groups/useGroupPermissions";
import type { GroupState } from "@/types";

const ROLE_LABELS: Record<StudyGroupMember["role"], string> = {
  autor: "Creador",
  admin: "Admin",
  miembro: "Miembro",
};

const COLORS = {
  bg: "#1A1A1A",
  bgDark: "#161616",
  surface: "#1E1E1E",
  surfaceAlt: "#262626",
  surfaceLight: "#2D2D2D",
  border: "#2D2D2D",
  primary: "#0047AB",
  primaryDark: "#00378B",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#F5F5F5",
  textMuted: "#9CA3A0",
  textDim: "#6B7280",
  textDark: "#4B5563",
  red: "#EF4444",
  redBg: "rgba(239,68,68,0.1)",
  green: "#10B981",
  greenBg: "rgba(16,185,129,0.1)",
  emerald: "#10B981",
  yellow: "#EAB308",
  overlay: "rgba(0,0,0,0.9)",
};

interface AdminDashboardLayoutProps {
  requestId?: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AdminDashboardLayout({ requestId }: AdminDashboardLayoutProps) {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";

  const {
    activeRequest,
    applications,
    members,
    messages,
    stats,
    loading,
    error,
    sendingMessage,
    handleSendMessage,
    requestAdminTransfer,
    handleReviewApplication,
    updateDescription,
    voteInPoll,
  } = useStudyGroupDashboard({ requestId });

  const [activeTab, setActiveTab] = useState<"pendientes" | "aceptadas" | "rechazadas">("pendientes");
  const [newMessage, setNewMessage] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [transferMode, setTransferMode] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [hasPendingTransfer, setHasPendingTransfer] = useState(false);
  const [loadingTransferCheck, setLoadingTransferCheck] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDelegateWarning, setShowDelegateWarning] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [startingChat, setStartingChat] = useState(false);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<any | null>(null);

  const router = useRouter();
  const { getOrCreateConversation } = useMessaging();
  const scrollRef = useRef<ScrollView>(null);

  const isAdmin = useMemo(() => {
    const member = members.find((m) => m.userId === userId);
    return member?.role === "admin" || member?.role === "autor";
  }, [members, userId]);

  const isCreator = useMemo(() => {
    return activeRequest?.author_id === userId;
  }, [activeRequest?.author_id, userId]);

  const isOnlyAdmin = useMemo(() => {
    const adminCount = members.filter((m) => m.role === "admin" || m.role === "autor").length;
    if (isCreator) return true;
    return adminCount <= 1;
  }, [members, isCreator]);

  const groupState: GroupState = useMemo(() => {
    if (hasPendingTransfer) return "PendienteTransferencia";
    if (activeRequest?.is_active === false) return "Disuelto";
    return "Activo";
  }, [hasPendingTransfer, activeRequest?.is_active]);

  const perms = useMemo(() => getGroupPermissions(groupState), [groupState]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (activeTab === "pendientes") return app.status === "pendiente";
      if (activeTab === "aceptadas") return app.status === "aceptada";
      return app.status === "rechazada";
    });
  }, [applications, activeTab]);

  const handleInputChange = (text: string) => {
    setNewMessage(text);
    const lastWord = text.split(" ").pop() || "";
    if (lastWord.startsWith("@")) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member: any) => {
    const words = newMessage.split(" ");
    words.pop();
    const name = member.fullName || "Integrante";
    const updated = [...words, `@${name} `].join(" ");
    setNewMessage(updated);
    setShowMentions(false);
    if (!selectedMentions.some((m) => m.userId === member.userId)) {
      setSelectedMentions([...selectedMentions, { userId: member.userId, displayName: name }]);
    }
  };

  const handleSend = () => {
    if ((!newMessage.trim() && !pendingAttachment) || sendingMessage) return;

    const finalMentions = selectedMentions.filter((m) =>
      newMessage.includes(`@${m.displayName}`)
    );

    handleSendMessage(newMessage, finalMentions, pendingAttachment || undefined);

    setNewMessage("");
    setSelectedMentions([]);
    setPendingAttachment(null);
  };

  const handleFileSelect = async () => {
    try {
      setUploadingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file || !userId) return;

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const path = `${userId}/chat/${fileName}`;

      const expoFile = new File(file.uri);
      const arrayBuffer = await expoFile.arrayBuffer();

      const { data, error } = await supabase.storage
        .from("resources")
        .upload(path, arrayBuffer, {
          contentType: file.mimeType ?? "application/octet-stream",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from("resources").getPublicUrl(path);

      setPendingAttachment({
        url: publicUrlData.publicUrl,
        type: file.mimeType || "application/octet-stream",
        filename: file.name,
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      Alert.alert("Error", "No se pudo subir el archivo. Inténtalo de nuevo.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleLeaveDirectly = async () => {
    if (!requestId) return;
    setLeavingGroup(true);
    try {
      await fetchApi(`/study-groups/${requestId}/leave`, { method: "POST" });
      setShowLeaveConfirm(false);
      router.replace("/(tabs)/feed" as any);
    } catch (err: any) {
      console.error("Error leaving group:", err);
    } finally {
      setLeavingGroup(false);
    }
  };

  const handlePrivateChat = async (targetUserId: string) => {
    if (targetUserId === userId || startingChat) return;
    setStartingChat(true);
    try {
      const conversation = await getOrCreateConversation(userId, targetUserId);
      router.push(`/chat/${conversation.id}` as any);
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setStartingChat(false);
    }
  };

  const checkPendingTransfers = useCallback(async () => {
    if (!userId || !requestId) {
      setLoadingTransferCheck(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("study_request_admin_transfers")
        .select("id")
        .eq("request_id", requestId)
        .eq("from_user_id", userId)
        .eq("status", "pendiente")
        .maybeSingle();

      setHasPendingTransfer(!!data);
    } catch (err) {
      console.error("Error checking transfers:", err);
      setHasPendingTransfer(false);
    } finally {
      setLoadingTransferCheck(false);
    }
  }, [userId, requestId]);

  useEffect(() => {
    if (activeRequest?.description) setDescDraft(activeRequest.description);
  }, [activeRequest?.description]);

  useEffect(() => {
    checkPendingTransfers();
  }, [checkPendingTransfers]);

  useEffect(() => {
    if (!requestId || !userId) return;

    const channel = supabase.channel(`presence_${requestId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const activeIds = Object.values(newState)
          .flat()
          .map((p: any) => p.user_id)
          .filter(Boolean);
        setOnlineUsers(activeIds);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [requestId, userId]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const transferAccepted = useNotificationStore((s) => s.transferAccepted);
  const resetTransferAccepted = useNotificationStore((s) => s.resetTransferAccepted);

  useEffect(() => {
    if (transferAccepted) {
      console.log("[AdminDashboard] Transferencia aceptada detectada. Redirigiendo para evitar 403...");
      resetTransferAccepted();
      router.dismissAll();
      router.replace("/(tabs)/feed" as any);
    }
  }, [transferAccepted, router, resetTransferAccepted]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {/* LEFT COLUMN: Chat */}
        <View style={styles.leftColumn}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View>
              <Text style={styles.chatTitle}>Chat Grupal</Text>
              <View style={styles.chatSubtitleRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.chatSubtitle}>
                  {members.length} MIEMBROS ACTIVOS
                </Text>
              </View>
            </View>
            <View style={styles.chatHeaderActions}>
              <Ionicons name="search" size={20} color={COLORS.textDim} />
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textDim} />
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  msg.senderId === userId ? styles.messageRowMine : styles.messageRowOther,
                ]}
              >
                <View style={styles.messageMeta}>
                  <Text style={styles.messageSender}>
                    {msg.senderFullName || "Integrante"}
                  </Text>
                  <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
                </View>

                <View
                  style={[
                    styles.messageBubble,
                    msg.senderId === userId
                      ? styles.messageBubbleMine
                      : styles.messageBubbleOther,
                  ]}
                >
                  {(() => {
                    const decoratedMessage = transformRawMessage(msg, (optionIndex) => {
                      voteInPoll(msg.id, optionIndex).catch((err) =>
                        console.error("vote error:", err),
                      );
                    });
                    return (
                      <View style={styles.messageContent}>
                        {decoratedMessage.render({ currentUserId: userId })}
                        {msg.senderId === userId && (
                          <Ionicons
                            name="checkmark-done"
                            size={12}
                            color={COLORS.white}
                            style={styles.doneIcon}
                          />
                        )}
                      </View>
                    );
                  })()}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.inputArea}
          >
            {/* Mention Suggestions Popover */}
            {showMentions && (
              <View style={styles.mentionsContainer}>
                <View style={styles.mentionsHeader}>
                  <Text style={styles.mentionsTitle}>Mencionar integrante</Text>
                </View>
                <ScrollView style={styles.mentionsList} nestedScrollEnabled>
                  {members
                    .filter((m) => (m.fullName || "").toLowerCase().includes(mentionQuery))
                    .map((member) => (
                      <TouchableOpacity
                        key={member.userId}
                        style={styles.mentionItem}
                        onPress={() => insertMention(member)}
                      >
                        <View style={styles.mentionAvatar}>
                          <Text style={styles.mentionAvatarText}>
                            {(member.fullName || "??").substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.mentionName}>
                            {member.fullName || "Integrante"}
                          </Text>
                          <Text style={styles.mentionRole}>
                            {ROLE_LABELS[member.role]}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* Pending Attachment Preview */}
            {pendingAttachment && (
              <View style={styles.attachmentPreview}>
                <View style={styles.attachmentIconBox}>
                  <Ionicons
                    name={pendingAttachment.type?.startsWith("image/") ? "image-outline" : "document-outline"}
                    size={20}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {pendingAttachment.filename}
                  </Text>
                  <Text style={styles.attachmentReady}>Listo para enviar</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPendingAttachment(null)}
                  style={styles.attachmentRemove}
                >
                  <Ionicons name="close" size={14} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              <TouchableOpacity
                onPress={handleFileSelect}
                disabled={uploadingFile}
                style={styles.attachButton}
              >
                {uploadingFile ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name="attach" size={22} color={COLORS.textDim} />
                )}
              </TouchableOpacity>
              <TextInput
                value={newMessage}
                onChangeText={handleInputChange}
                onSubmitEditing={handleSend}
                editable={!uploadingFile}
                placeholder={uploadingFile ? "Subiendo archivo..." : "Escribe un mensaje aquí... (usa @ para mencionar)"}
                placeholderTextColor={COLORS.textDark}
                style={styles.textInput}
                returnKeyType="send"
              />
              <View style={styles.inputRight}>
                <Ionicons name="happy-outline" size={22} color={COLORS.textDim} />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={(!newMessage.trim() && !pendingAttachment) || sendingMessage || uploadingFile}
                  style={[
                    styles.sendButton,
                    (newMessage.trim() || pendingAttachment) && !sendingMessage && !uploadingFile
                      ? styles.sendButtonActive
                      : styles.sendButtonInactive,
                  ]}
                >
                  <Ionicons
                    name="send"
                    size={16}
                    color={
                      (newMessage.trim() || pendingAttachment) && !sendingMessage && !uploadingFile
                        ? COLORS.white
                        : COLORS.textDark
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* RIGHT COLUMN: Admin Management */}
        <View style={styles.rightColumn}>
          {/* Leave Button */}
          <View style={styles.leaveBtnRow}>
            <TouchableOpacity
              onPress={() => {
                if (loadingTransferCheck) return;
                if (hasPendingTransfer) return;
                if (perms.isReadOnly) return;
                if (transferMode) {
                  setTransferMode(false);
                  setSelectedCandidateId(null);
                  return;
                }
                if (isOnlyAdmin) setShowDelegateWarning(true);
                else setShowLeaveConfirm(true);
              }}
              disabled={hasPendingTransfer || loadingTransferCheck || leavingGroup || perms.isReadOnly}
              style={[
                styles.leaveBtn,
                (hasPendingTransfer || perms.isReadOnly) && styles.leaveBtnDisabled,
              ]}
            >
              <Ionicons
                name={transferMode ? "close" : "log-out-outline"}
                size={18}
                color={
                  hasPendingTransfer || perms.isReadOnly
                    ? COLORS.textDark
                    : COLORS.red
                }
              />
              <Text
                style={[
                  styles.leaveBtnText,
                  (hasPendingTransfer || perms.isReadOnly) && styles.leaveBtnTextDisabled,
                ]}
              >
                {hasPendingTransfer
                  ? "Solicitud enviada"
                  : transferMode
                    ? "Cancelar Salida"
                    : "Salir del Grupo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Group Info */}
          <View style={styles.groupInfoSection}>
            <Text style={styles.facultyLabel}>
              {activeRequest?.faculty_name || "FACULTAD DE INTELIGENCIA ARTIFICIAL E INGENIERÍAS"}
            </Text>
            <Text style={styles.groupTitle}>
              {activeRequest?.title || "Cargando..."}
            </Text>
            <View style={styles.groupTags}>
              <View style={styles.tag}>
                <Ionicons name="book-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.tagText}>
                  {activeRequest?.subject_name || "General"}
                </Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.tagText}>
                  {members.length} / {activeRequest?.max_members || 0}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionCard}>
              <View style={styles.descriptionHeader}>
                <Text style={styles.descriptionLabel}>Descripción</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isEditingDesc) {
                      updateDescription(descDraft);
                      setIsEditingDesc(false);
                    } else {
                      setIsEditingDesc(true);
                    }
                  }}
                >
                  <Ionicons
                    name={isEditingDesc ? "checkmark" : "create-outline"}
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
              {isEditingDesc ? (
                <TextInput
                  value={descDraft}
                  onChangeText={setDescDraft}
                  multiline
                  style={styles.descInput}
                />
              ) : (
                <Text style={styles.descText}>
                  {activeRequest?.description || "Sin descripción disponible."}
                </Text>
              )}
            </View>
          </View>

          {/* Applications Management */}
          <View style={styles.applicationsSection}>
            <View style={styles.applicationsHeader}>
              <View style={styles.applicationsTitleRow}>
                <Text style={styles.sectionTitle}>Solicitudes</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats?.pending || 0}</Text>
                </View>
              </View>
              <View style={styles.tabRow}>
                {(["pendientes", "aceptadas", "rechazadas"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.tab,
                      activeTab === tab && styles.tabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.tabTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ScrollView
              style={styles.applicationsList}
              contentContainerStyle={styles.applicationsListContent}
              nestedScrollEnabled
            >
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <View key={app.id} style={styles.applicationCard}>
                    <View style={styles.applicationLeft}>
                      <View style={styles.applicationAvatar}>
                        {app.profiles?.avatar_url ? (
                          <Image
                            source={{ uri: app.profiles.avatar_url }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarInitial}>
                            {app.profiles?.full_name?.substring(0, 1) || "?"}
                          </Text>
                        )}
                      </View>
                      <View>
                        <Text style={styles.applicationName}>
                          {app.profiles?.full_name || "Cargando..."}
                        </Text>
                        <Text style={styles.applicationDate}>
                          {new Date(app.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.applicationActions}>
                      <TouchableOpacity
                        onPress={() => handlePrivateChat(app.applicant_id)}
                        style={styles.iconBtn}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={16}
                          color={COLORS.textDim}
                        />
                      </TouchableOpacity>
                      {app.status === "pendiente" && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleReviewApplication(app.id, "aceptada")}
                            style={styles.iconBtnSuccess}
                          >
                            <Ionicons name="checkmark" size={16} color={COLORS.green} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleReviewApplication(app.id, "rechazada")}
                            style={styles.iconBtnDanger}
                          >
                            <Ionicons name="close" size={16} color={COLORS.red} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>Sin solicitudes</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Members List */}
          <View style={styles.membersSection}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersTitle}>Integrantes del Grupo</Text>
              <Text style={styles.membersCount}>{members.length} TOTAL</Text>
            </View>

            <ScrollView
              style={styles.membersList}
              contentContainerStyle={styles.membersListContent}
              nestedScrollEnabled
            >
              {members.map((member) => (
                <View
                  key={member.userId}
                  style={[
                    styles.memberCard,
                    selectedCandidateId === member.userId && styles.memberCardSelected,
                  ]}
                >
                  <View style={styles.memberRow}>
                    <View style={styles.memberLeft}>
                      <View style={styles.memberAvatar}>
                        {member.avatarUrl ? (
                          <Image
                            source={{ uri: member.avatarUrl }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <View style={styles.memberAvatarPlaceholder}>
                            <Text style={styles.memberAvatarInitial}>
                              {member.fullName?.substring(0, 1) || "?"}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View>
                        <Text style={styles.memberName}>
                          {member.fullName || "Integrante"}
                        </Text>
                        <View style={styles.memberMeta}>
                          <Text
                            style={[
                              styles.memberRole,
                              member.role === "autor" && styles.memberRoleCreator,
                            ]}
                          >
                            {ROLE_LABELS[member.role]}
                          </Text>
                          <Text style={styles.memberMetaSep}>•</Text>
                          <View
                            style={
                              onlineUsers.includes(member.userId)
                                ? styles.statusDotOnline
                                : styles.statusDotOffline
                            }
                          />
                          <Text
                            style={
                              onlineUsers.includes(member.userId)
                                ? styles.statusTextOnline
                                : styles.statusTextOffline
                            }
                          >
                            {onlineUsers.includes(member.userId) ? "Conectado" : "Desconectado"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.memberActions}>
                      {transferMode && member.userId !== userId ? (
                        <TouchableOpacity
                          onPress={() => setSelectedCandidateId(member.userId)}
                          style={[
                            styles.chooseBtn,
                            selectedCandidateId === member.userId && styles.chooseBtnSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chooseBtnText,
                              selectedCandidateId === member.userId && styles.chooseBtnTextSelected,
                            ]}
                          >
                            {selectedCandidateId === member.userId ? "Elegido" : "Elegir"}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => handlePrivateChat(member.userId)}
                            disabled={member.userId === userId}
                            style={[
                              styles.iconBtn,
                              member.userId === userId && styles.iconBtnDisabled,
                            ]}
                          >
                            <Ionicons
                              name="chatbubble-outline"
                              size={16}
                              color={
                                member.userId === userId
                                  ? COLORS.textDark
                                  : COLORS.textDim
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons
                              name="ellipsis-horizontal"
                              size={16}
                              color={COLORS.textDim}
                            />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {transferMode && (
              <View style={styles.transferConfirm}>
                <TouchableOpacity
                  onPress={async () => {
                    if (selectedCandidateId) {
                      await requestAdminTransfer(selectedCandidateId);
                      setTransferMode(false);
                      setHasPendingTransfer(true);
                    }
                  }}
                  disabled={!selectedCandidateId}
                  style={[
                    styles.transferBtn,
                    !selectedCandidateId && styles.transferBtnDisabled,
                  ]}
                >
                  <Text style={styles.transferBtnText}>CONFIRMAR Y SALIR</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Leave Confirm Modal */}
      <Modal
        visible={showLeaveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveConfirm(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLeaveConfirm(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Abandonar grupo?</Text>
            <Text style={styles.modalDesc}>Esta acción es permanente e inmediata.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleLeaveDirectly}
                style={styles.modalBtnDanger}
              >
                <Text style={styles.modalBtnDangerText}>SÍ, SALIR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowLeaveConfirm(false)}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delegate Warning Modal */}
      <Modal
        visible={showDelegateWarning && perms.canTransfer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDelegateWarning(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDelegateWarning(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.warningIconBox}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Acción Requerida</Text>
            <Text style={styles.modalDesc}>
              Como único administrador, debes delegar el control antes de salir.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowDelegateWarning(false);
                  setTransferMode(true);
                }}
                style={styles.modalBtnPrimary}
              >
                <Text style={styles.modalBtnPrimaryText}>EMPEZAR DELEGACIÓN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDelegateWarning(false)}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>CERRAR</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mainRow: {
    flex: 1,
    flexDirection: "row",
  },

  // LEFT COLUMN
  leftColumn: {
    flex: 0.65,
    flexDirection: "column",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  chatHeader: {
    padding: 24,
    backgroundColor: "rgba(26,26,26,0.8)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: COLORS.white,
  },
  chatSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  chatSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.primary,
  },
  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  messagesContent: {
    padding: 32,
    gap: 24,
  },
  messageRow: {
    flexDirection: "column",
  },
  messageRowMine: {
    alignItems: "flex-end",
  },
  messageRowOther: {
    alignItems: "flex-start",
  },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  messageSender: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.textDim,
    textTransform: "uppercase",
  },
  messageTime: {
    fontSize: 9,
    color: COLORS.textDark,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 16,
  },
  messageBubbleMine: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.surfaceLight,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  doneIcon: {
    marginLeft: 8,
    opacity: 0.5,
  },

  // INPUT AREA
  inputArea: {
    padding: 24,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0,71,171,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,71,171,0.3)",
    padding: 12,
    borderRadius: 16,
  },
  attachmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentInfo: {
    maxWidth: 200,
  },
  attachmentName: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.white,
  },
  attachmentReady: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.primary,
  },
  attachmentRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.redBg,
    alignItems: "center",
    justifyContent: "center",
  },

  // MENTIONS
  mentionsContainer: {
    width: "100%",
    maxHeight: 240,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    overflow: "hidden",
  },
  mentionsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  mentionsTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mentionsList: {
    maxHeight: 192,
  },
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mentionAvatarText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.white,
  },
  mentionName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  mentionRole: {
    fontSize: 10,
    color: COLORS.textDim,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: COLORS.surfaceAlt,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  attachButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: "transparent",
    color: COLORS.white,
    fontSize: 14,
    paddingVertical: 4,
  },
  inputRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonInactive: {
    backgroundColor: "#262626",
  },

  // RIGHT COLUMN
  rightColumn: {
    flex: 0.35,
    backgroundColor: COLORS.bgDark,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  leaveBtnRow: {
    padding: 24,
    alignItems: "flex-end",
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  leaveBtnDisabled: {
    backgroundColor: "#171717",
    borderColor: "#262626",
  },
  leaveBtnText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COLORS.red,
  },
  leaveBtnTextDisabled: {
    color: COLORS.textDark,
  },

  // GROUP INFO
  groupInfoSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  facultyLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    color: COLORS.white,
    marginBottom: 8,
  },
  groupTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  descriptionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.textDim,
    textTransform: "uppercase",
  },
  descInput: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  descText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },

  // APPLICATIONS
  applicationsSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  applicationsHeader: {
    marginBottom: 24,
  },
  applicationsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.white,
    textTransform: "uppercase",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.white,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginTop: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: COLORS.textDim,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: COLORS.white,
  },
  applicationsList: {
    minHeight: 100,
  },
  applicationsListContent: {
    gap: 12,
  },
  applicationCard: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  applicationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  applicationAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.white,
  },
  applicationName: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.white,
  },
  applicationDate: {
    fontSize: 9,
    color: COLORS.textDim,
  },
  applicationActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  iconBtnDisabled: {
    opacity: 0.3,
  },
  iconBtnSuccess: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.greenBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },
  iconBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.redBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.3,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.white,
    textTransform: "uppercase",
    marginTop: 8,
  },

  // MEMBERS
  membersSection: {
    padding: 24,
  },
  membersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  membersTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.textDim,
    textTransform: "uppercase",
  },
  membersCount: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textDark,
  },
  membersList: {
    maxHeight: 400,
  },
  membersListContent: {
    gap: 16,
  },
  memberCard: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  memberCardSelected: {
    backgroundColor: "rgba(0,71,171,0.1)",
    borderColor: COLORS.primary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  memberAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarInitial: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.white,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textSecondary,
  },
  memberMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  memberRole: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.textDim,
    textTransform: "uppercase",
  },
  memberRoleCreator: {
    color: COLORS.yellow,
  },
  memberMetaSep: {
    fontSize: 8,
    color: COLORS.textDark,
  },
  statusDotOnline: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.emerald,
  },
  statusDotOffline: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textDark,
  },
  statusTextOnline: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: COLORS.emerald,
  },
  statusTextOffline: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: COLORS.textDark,
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  chooseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chooseBtnSelected: {
    backgroundColor: COLORS.primary,
  },
  chooseBtnText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  chooseBtnTextSelected: {
    color: COLORS.white,
  },
  transferConfirm: {
    marginTop: 32,
  },
  transferBtn: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  transferBtnDisabled: {
    opacity: 0.3,
  },
  transferBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 32,
    padding: 40,
    maxWidth: 360,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  modalActions: {
    gap: 12,
  },
  modalBtnDanger: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: COLORS.red,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnDangerText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
  },
  modalBtnCancel: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "transparent",
    borderRadius: 16,
    alignItems: "center",
  },
  modalBtnCancelText: {
    color: COLORS.textDim,
    fontWeight: "700",
    fontSize: 13,
  },
  modalBtnPrimary: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
  },
  warningIconBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "rgba(0,71,171,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(0,71,171,0.2)",
  },
});
