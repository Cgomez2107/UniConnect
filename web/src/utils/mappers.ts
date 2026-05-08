import {
  Profile as ProfileApi,
  AdminUser as AdminUserApi,
  Message as MessageApi,
  Conversation as ConversationApi,
  CampusEvent as CampusEventApi,
  StudyResource as StudyResourceApi,
  StudentSearchResult as StudentSearchResultApi,
  StudyRequest as StudyRequestApi,
} from "@/types";
import {
  ProfileUI,
  AdminUserUI,
  MessageUI,
  ConversationUI,
  CampusEventUI,
  StudyResourceUI,
  StudentSearchResultUI,
  StudyRequestUI,
  UserSessionUI,
} from "@/types/ui";

export function mapAuthUserApiToUI(u: any): UserSessionUI {
  return {
    id: u.id,
    email: u.email,
    name: u.full_name || u.name || "",
    fullName: u.full_name || u.name || "",
    profileImage: u.profile_image ?? u.profileImage ?? u.avatar_url ?? null,
    role: u.role === "admin" ? "admin" : "estudiante",
    program: u.programs && u.programs.length ? { id: u.programs[0].id, name: u.programs[0].name } : u.program_name ? { id: "", name: u.program_name } : null,
    semester: u.semester ?? null,
    studySubjects: (u.study_subjects || u.subjects || []).map((s: any) => ({ id: s.id, name: s.name })),
  };
}

export function mapProfileApiToUI(p: ProfileApi): ProfileUI {
  return {
    id: p.id,
    fullName: p.full_name,
    avatarUrl: p.avatar_url,
    bio: p.bio,
    phoneNumber: p.phone_number,
    role: p.role,
    semester: p.semester,
    isActive: p.is_active,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export function mapAdminUserApiToUI(u: AdminUserApi): AdminUserUI {
  return {
    id: u.id,
    fullName: (u as any).full_name || (u as any).fullName || "",
    email: (u as any).email,
    role: (u as any).role,
    isActive: (u as any).is_active ?? (u as any).isActive ?? true,
    semester: (u as any).semester ?? null,
    avatarUrl: (u as any).avatar_url ?? null,
    createdAt: (u as any).created_at ?? new Date().toISOString(),
  };
}

export function mapMessageApiToUI(m: MessageApi): MessageUI {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    mediaUrl: m.media_url ?? null,
    mediaType: m.media_type ?? null,
    mediaFilename: m.media_filename ?? null,
    replyToMessageId: m.reply_to_message_id ?? null,
    replyPreview: m.reply_preview ?? null,
    clientStatus: m.client_status,
    clientError: m.client_error ?? null,
    createdAt: m.created_at,
    readAt: m.read_at ?? null,
    sender: m.sender ? { fullName: m.sender.full_name, avatarUrl: m.sender.avatar_url } : undefined,
  };
}

export function mapConversationApiToUI(c: ConversationApi): ConversationUI {
  return {
    id: c.id,
    participantA: (c as any).participant_a ?? (c as any).participantA,
    participantB: (c as any).participant_b ?? (c as any).participantB,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    otherUserId: c.other_user_id,
    otherUserName: c.other_user_name,
    otherUserAvatar: c.other_user_avatar,
    lastMessage: c.last_message ?? null,
    lastMessageAt: c.last_message_at ?? null,
    unreadCount: c.unread_count ?? 0,
  };
}

export function mapCampusEventApiToUI(e: CampusEventApi): CampusEventUI {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    eventDate: e.event_date,
    location: e.location ?? null,
    category: e.category,
    imageUrl: e.image_url ?? null,
    createdBy: e.created_by ?? null,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    creator: e.creator ? { fullName: (e.creator as any).full_name } : null,
  };
}

export function mapStudyResourceApiToUI(r: StudyResourceApi): StudyResourceUI {
  return {
    id: r.id,
    userId: r.user_id,
    programId: r.program_id,
    subjectId: r.subject_id,
    title: r.title,
    description: r.description ?? null,
    fileUrl: r.file_url,
    fileName: r.file_name,
    fileType: r.file_type ?? null,
    fileSizeKb: r.file_size_kb ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    profiles: r.profiles ? { fullName: (r.profiles as any).full_name, avatarUrl: (r.profiles as any).avatar_url } : undefined,
    subjects: r.subjects,
    subject: r.subjects,
    subjectName: r.subjects?.name ?? null,
    uploadedBy: r.profiles?.full_name ?? null,
    uploaderName: r.profiles?.full_name ?? null,
  };
}

export function mapStudentSearchResultApiToUI(s: StudentSearchResultApi): StudentSearchResultUI {
  return {
    id: s.id,
    fullName: s.full_name,
    avatarUrl: s.avatar_url,
    bio: s.bio,
    semester: s.semester,
    programName: s.program_name ?? null,
    facultyName: s.faculty_name ?? null,
    studySubjects: ((s as any).study_subjects ?? []).map((subject: any) => ({
      id: String(subject.id),
      name: String(subject.name),
    })),
  };
}

export function mapStudyRequestApiToUI(r: StudyRequestApi): StudyRequestUI {
  return {
    id: r.id,
    authorId: r.author_id,
    subjectId: r.subject_id,
    title: r.title,
    description: r.description,
    maxMembers: r.max_members,
    status: r.status,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    profiles: r.profiles as any,
    subjects: r.subjects as any,
    applicationsCount: r.applications_count ?? 0,
    facultyName: r.faculty_name,
    subjectName: r.subject_name ?? r.subjects?.name ?? "",
    creatorName: r.profiles?.full_name ?? "",
    memberCount: r.applications_count ?? 0,
  };
}

export default {
  mapProfileApiToUI,
  mapAdminUserApiToUI,
  mapMessageApiToUI,
  mapConversationApiToUI,
  mapCampusEventApiToUI,
  mapStudyResourceApiToUI,
  mapStudentSearchResultApiToUI,
  mapStudyRequestApiToUI,
};
