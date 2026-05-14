// Fuente única de verdad para todos los tipos del dominio UniConnect.
// No definir tipos de dominio en servicios individuales.

// ============================================================================
// AUTH
// ============================================================================

export type UserRole = "estudiante" | "admin";

export interface AuthProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  role: UserRole;
  semester: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PERFIL
// ============================================================================

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  role: UserRole;
  semester: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Relación usuario ↔ programa (tabla user_programs) */
export interface UserProgram {
  user_id: string;
  program_id: string;
  is_primary: boolean;
  enrolled_at: string;
  // join
  programs?: {
    id: string;
    name: string;
    faculty_id: string;
    faculties?: { name: string };
  };
}

/** Relación usuario ↔ materia (tabla user_subjects) */
export interface UserSubject {
  user_id: string;
  subject_id: string;
  enrolled_at: string;
  // join
  subjects?: { id: string; name: string };
}

// ============================================================================
// CATÁLOGO ACADÉMICO
// ============================================================================

export interface Faculty {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  code: string | null;
  faculty_id: string;
  is_active: boolean;
  created_at: string;
  // joins opcionales
  faculties?: { name: string };
  faculty_name?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  // join via program_subjects
  programs?: Program[];
}

export type MemberRole = "autor" | "admin" | "miembro";
export type AdminTransferStatus = "pendiente" | "aceptada" | "rechazada" | "cancelada";

export interface AdminTransfer {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  status: AdminTransferStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface Member {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: string | null;
}

// ============================================================================
// GRUPOS DE ESTUDIO
// ============================================================================

export type RequestStatus = "abierta" | "cerrada" | "expirada";
export type ApplicationStatus = "pendiente" | "aceptada" | "rechazada";
export type GroupStatus = "abierta" | "llena" | "transferenciaPendiente" | "cerrada" | "expirada";

export interface StudyRequest {
  id: string;
  authorId: string;
  subjectId: string;
  title: string;
  description: string;
  maxMembers: number;
  status: RequestStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    fullName: string;
    avatarUrl: string | null;
    bio?: string | null;
  };
  applicationsCount?: number;
  subjectName?: string;
  facultyName?: string;
}

export interface CreateStudyRequestPayload {
  subjectId: string;
  title: string;
  description: string;
  maxMembers: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  status: GroupStatus;
  max_members: number;
  current_members: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  requestId: string;
  applicantId: string;
  message: string;
  status: ApplicationStatus;
  reviewedAt: string | null;
  createdAt: string;
}

// ============================================================================
// MENSAJERÍA
// ============================================================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
  reply_to_message_id?: string | null;
  reply_preview?: string | null;
  client_status?: "sending" | "sent" | "retrying" | "failed";
  client_error?: string | null;
  created_at: string;
  read_at: string | null;
  // join
  sender?: { full_name: string; avatar_url: string | null };
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  updated_at: string;
  // datos enriquecidos para mostrar en la lista
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface SendMessagePayload {
  conversation_id: string;
  content: string;
}

// ============================================================================
// RECURSOS DE ESTUDIO
// ============================================================================

export interface StudyResource {
  id: string;
  user_id: string;
  program_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size_kb: number | null;
  created_at: string;
  updated_at: string;
  // joins opcionales para enriquecimiento
  profiles?: { full_name: string; avatar_url: string | null };
  subjects?: { name: string };
}

export interface CreateStudyResourcePayload {
  subject_id: string;
  title: string;
  description?: string;
  file_uri: string;
}

// ============================================================================
// BÚSQUEDA DE COMPAÑEROS
// ============================================================================

/** Resultado de la RPC search_students_by_subject */
export interface StudentSearchResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  semester: number | null;
  program_name: string | null;
  faculty_name: string | null;
}

/** Perfil público de otro estudiante con materias en común */
export interface StudentPublicProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  semester: number | null;
  program_name: string | null;
  faculty_name: string | null;
  /** Solo las materias que comparte con el usuario autenticado */
  shared_subjects: { id: string; name: string }[];
}

// ============================================================================
// ADMINISTRACIÓN
// ============================================================================

/** Usuario visto desde el panel de admin */
export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  semester: number | null;
  avatar_url: string | null;
  created_at: string;
}

/** Solicitud de estudio vista desde el panel de admin */
export interface AdminRequest {
  id: string;
  title: string;
  status: RequestStatus;
  created_at: string;
  author_name: string;
  subject_name: string;
  applications_count: number;
}

/** Recurso visto desde el panel de admin */
export interface AdminResource {
  id: string;
  title: string;
  file_type: string | null;
  file_size_kb: number | null;
  created_at: string;
  author_name: string;
  subject_name: string;
}

/** Métricas globales para el dashboard */
export interface AdminMetrics {
  totalUsers: number;
  activeStudents: number;
  openRequests: number;
  totalResources: number;
  totalMessages: number;
}

// ============================================================================
// EVENTOS DEL CAMPUS
// ============================================================================

export type EventCategory = "academico" | "cultural" | "deportivo" | "otro";

/** Evento del campus (vista estudiante y admin) */
export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;       // ISO 8601
  location: string | null;
  category: EventCategory;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // join opcional
  creator?: { full_name: string } | null;
}

/** Payload para crear/editar un evento */
export interface CreateEventPayload {
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  category: EventCategory;
  image_url?: string;
}

/** Evento visto desde el panel de admin (con nombre del creador aplanado) */
export interface AdminEvent {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  category: EventCategory;
  created_at: string;
  creator_name: string;
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
}

// ============================================================================
// FORMULARIOS
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface EditProfileFormData {
  full_name: string;
  bio?: string;
  phone_number?: string;
  avatar_url?: string;
  semester?: number;
}

export interface CreateEventFormData {
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  category: EventCategory;
  image_url?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
