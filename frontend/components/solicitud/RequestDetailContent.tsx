import { Colors } from "@/constants/Colors";
import type { Application } from "@/types";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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

interface RequestDetailViewModel {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  author_name: string;
  author_bio?: string | null;
  subject_name: string;
  faculty_name: string;
  max_members: number;
}

interface Props {
  C: (typeof Colors)["light"];
  request: RequestDetailViewModel;
  currentUserId?: string;
  chatLoading: boolean;
  insetsBottom: number;
  canManageRequest: boolean;
  isEditingDescription: boolean;
  setIsEditingDescription: (value: boolean) => void;
  descriptionDraft: string;
  setDescriptionDraft: (value: string) => void;
  isSavingDescription: boolean;
  onSaveDescription: () => void;
  onCancelDescriptionEdit: () => void;
  occupiedSlots: number;
  remainingSlots: number;
  acceptedMembers: Application[];
  pendingApplications: Application[];
  reviewingApplicationId: string | null;
  updatingAdminUserId: string | null;
  isExtraAdmin: (userId: string) => boolean;
  onSetAdmin: (userId: string, makeAdmin: boolean) => void;
  onReviewApplication: (applicationId: string, status: "aceptada" | "rechazada") => void;
  onOpenApplicantProfile: (applicantId: string) => void;
  onOpenMemberChat: (userId: string, userName: string) => void;
}

export function RequestDetailContent({
  C,
  request,
  currentUserId,
  chatLoading,
  insetsBottom,
  canManageRequest,
  isEditingDescription,
  setIsEditingDescription,
  descriptionDraft,
  setDescriptionDraft,
  isSavingDescription,
  onSaveDescription,
  onCancelDescriptionEdit,
  occupiedSlots,
  remainingSlots,
  acceptedMembers,
  pendingApplications,
  reviewingApplicationId,
  updatingAdminUserId,
  isExtraAdmin,
  onSetAdmin,
  onReviewApplication,
  onOpenApplicantProfile,
  onOpenMemberChat,
}: Props) {
  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insetsBottom + 260 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.authorCard, { backgroundColor: C.surface, borderColor: C.border }]}> 
        <View style={[styles.avatarLarge, { backgroundColor: C.primary + "20" }]}> 
          <Text style={[styles.avatarInitials, { color: C.primary }]}>{getInitials(request.author_name)}</Text>
        </View>

        <Text style={[styles.authorName, { color: C.textPrimary }]}>{request.author_name}</Text>

        {request.author_bio ? <Text style={[styles.authorBio, { color: C.textSecondary }]}>{request.author_bio}</Text> : null}

        <Text style={[styles.authorTime, { color: C.textPlaceholder }]}>Publicado {getTimeAgo(request.created_at)}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaChip, { backgroundColor: C.primary + "15", borderColor: C.primary + "30" }]}> 
          <Text style={[styles.metaChipText, { color: C.primary }]}>📚 {request.subject_name}</Text>
        </View>

        <View style={[styles.metaChip, { backgroundColor: C.surface, borderColor: C.border }]}> 
          <Text style={[styles.metaChipText, { color: C.textSecondary }]}>🏛 {request.faculty_name}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View
          style={[
            styles.metaChip,
            {
              backgroundColor: request.status === "abierta" ? C.success + "15" : C.border,
              borderColor: request.status === "abierta" ? C.success + "40" : C.border,
            },
          ]}
        >
          <Text style={[styles.metaChipText, { color: request.status === "abierta" ? C.success : C.textSecondary }]}> 
            👥 {remainingSlots} cupos disponibles · {request.status}
          </Text>
        </View>
      </View>

      <View style={[styles.section, { borderColor: C.border }]}>
        <Text style={[styles.sectionLabel, { color: C.textPlaceholder }]}>TÍTULO</Text>
        <Text style={[styles.titleText, { color: C.textPrimary }]}>{request.title}</Text>
      </View>

      <View style={[styles.section, { borderColor: C.border }]}>
        <Text style={[styles.sectionLabel, { color: C.textPlaceholder }]}>DESCRIPCIÓN</Text>

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
                onPress={onCancelDescriptionEdit}
                activeOpacity={0.85}
              >
                <Text style={[styles.editBtnText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: isSavingDescription ? C.border : C.primary }]}
                onPress={onSaveDescription}
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
            <Text style={[styles.descText, { color: C.textPrimary }]}>{request.description}</Text>
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
          <Text style={[styles.counterText, { color: C.primary }]}>Integrantes: {occupiedSlots}/{request.max_members}</Text>
        </View>

        <View style={[styles.memberCard, { backgroundColor: C.surface, borderColor: C.border }]}> 
          <View style={[styles.memberAvatar, { backgroundColor: C.primary + "20" }]}> 
            <Text style={[styles.memberAvatarText, { color: C.primary }]}>{getInitials(request.author_name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.memberName, { color: C.textPrimary }]}>{request.author_name}</Text>
            <Text style={[styles.memberRole, { color: C.primary }]}>Creador · Administrador</Text>
          </View>

          {request.author_id !== currentUserId && (
            <TouchableOpacity
              style={[styles.chatMemberBtn, { borderColor: C.primary }]}
              onPress={() => onOpenMemberChat(request.author_id, request.author_name)}
              disabled={chatLoading}
              activeOpacity={0.85}
            >
              {chatLoading ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <Text style={[styles.chatMemberBtnText, { color: C.primary }]}>Chatear</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {acceptedMembers.map((member) => {
          const name = member.profiles?.full_name ?? "Integrante";
          const canChatWithMember = member.applicant_id !== currentUserId;

          return (
            <View key={member.id} style={[styles.memberCard, { backgroundColor: C.surface, borderColor: C.border }]}> 
              <View style={[styles.memberAvatar, { backgroundColor: C.success + "20" }]}> 
                <Text style={[styles.memberAvatarText, { color: C.success }]}>{getInitials(name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, { color: C.textPrimary }]}>{name}</Text>
                <Text style={[styles.memberRole, { color: isExtraAdmin(member.applicant_id) ? C.primary : C.success }]}>
                  {isExtraAdmin(member.applicant_id) ? "Administrador" : "Participante aceptado"}
                </Text>
              </View>

              {canChatWithMember && (
                <TouchableOpacity
                  style={[styles.chatMemberBtn, { borderColor: C.primary }]}
                  onPress={() => onOpenMemberChat(member.applicant_id, name)}
                  disabled={chatLoading}
                  activeOpacity={0.85}
                >
                  {chatLoading ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Text style={[styles.chatMemberBtnText, { color: C.primary }]}>Chatear</Text>
                  )}
                </TouchableOpacity>
              )}

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
                  onPress={() => onSetAdmin(member.applicant_id, !isExtraAdmin(member.applicant_id))}
                  disabled={updatingAdminUserId === member.applicant_id}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.adminToggleText, { color: isExtraAdmin(member.applicant_id) ? C.error : C.primary }]}> 
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
                <View key={app.id} style={[styles.pendingCard, { backgroundColor: C.surface, borderColor: C.border }]}> 
                  <View style={[styles.memberAvatar, { backgroundColor: C.primary + "20" }]}> 
                    <Text style={[styles.memberAvatarText, { color: C.primary }]}>{getInitials(name)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => onOpenApplicantProfile(app.applicant_id)} activeOpacity={0.75}>
                      <Text style={[styles.memberName, styles.profileLink, { color: C.textPrimary }]}>{name}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.pendingMessage, { color: C.textSecondary }]} numberOfLines={2}>
                      &quot;{app.message}&quot;
                    </Text>
                  </View>

                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={[styles.smallActionBtn, styles.rejectBtn, { borderColor: C.error }]}
                      onPress={() => onReviewApplication(app.id, "rechazada")}
                      disabled={loadingAction}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.smallActionText, { color: C.error }]}>Rechazar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallActionBtn, { backgroundColor: loadingAction ? C.border : C.success }]}
                      onPress={() => onReviewApplication(app.id, "aceptada")}
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
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
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
  chatMemberBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  chatMemberBtnText: {
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
});
