// UI-friendly (camelCase) domain models for React components

export interface ProfileUI {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
  role: "estudiante" | "admin";
  semester: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // D02 — Decoradores opcionales (pueden venir o no del backend)
  indicadores?: {
    gruposBajoAdministracion: number;
    gruposParticipa: number;
    mensajesEnviados: number;
  };
  insignias?: Array<{
    id: string;
    nombre: string;
    descripcion: string;
    iconoUrl: string;
    fechaObtenida: string;
  }>;
}

export interface AdminUserUI {
  id: string;
  fullName: string;
  email: string;
  role: "estudiante" | "admin";
  isActive: boolean;
  semester: number | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface MessageReactionUI {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageMentionUI {
  userId: string;
  displayName: string;
  position: number;
}

export interface MessageUI {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaFilename?: string | null;
  replyToMessageId?: string | null;
  replyPreview?: string | null;
  clientStatus?: "sending" | "sent" | "retrying" | "failed";
  clientError?: string | null;
  createdAt: string;
  readAt: string | null;
  sender?: { fullName: string; avatarUrl: string | null };
  mentions?: MessageMentionUI[];
  reactions?: MessageReactionUI[];
}

export interface ConversationUI {
  id: string;
  participantA: string;
  participantB: string;
  createdAt: string;
  updatedAt: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export type EventCategoryUI = "academico" | "cultural" | "deportivo" | "otro";

export interface CampusEventUI {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  category: EventCategoryUI;
  imageUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: { fullName: string } | null;
}

export interface StudyResourceUI {
  id: string;
  userId: string;
  programId: string;
  subjectId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string | null;
  fileSizeKb: number | null;
  createdAt: string;
  updatedAt: string;
  profiles?: { fullName: string; avatarUrl: string | null };
  subjects?: { name: string };
  subject?: { name: string };
  subjectName?: string | null;
  uploadedBy?: string | null;
  uploaderName?: string | null;
}

export interface SubjectMiniUI {
  id: string;
  name: string;
}

export interface StudentSearchResultUI {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  semester: number | null;
  programName: string | null;
  facultyName: string | null;
  studySubjects?: SubjectMiniUI[];
}

export type RequestStatusUI = "abierta" | "cerrada" | "expirada";

export interface StudyRequestUI {
  id: string;
  authorId: string;
  subjectId: string;
  title: string;
  description: string;
  maxMembers: number;
  status: RequestStatusUI;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profiles?: { fullName: string; avatarUrl: string | null };
  subjects?: { name?: string } | any;
  applicationsCount?: number;
  facultyName?: string;
  subjectName?: string;
  creatorName?: string;
  memberCount?: number;
}

export interface UserSessionUI {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  profileImage?: string | null;
  role: "estudiante" | "admin";
  program?: { id: string; name: string } | null;
  semester?: number | null;
  studySubjects?: SubjectMiniUI[];
}
