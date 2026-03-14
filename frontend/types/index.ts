// Fuente única de verdad para todos los tipos del dominio UniConnect.
// No definir tipos de dominio en servicios individuales.


// AUTH


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


// PERFIL


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


// CATÁLOGO ACADÉMICO


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


// GRUPOS DE ESTUDIO


export type RequestStatus = "abierta" | "cerrada" | "expirada";
export type ApplicationStatus = "pendiente" | "aceptada" | "rechazada";

export interface StudyRequest {
  id: string;
  author_id: string;
  subject_id: string;
  title: string;
  description: string;
  max_members: number;
  status: RequestStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joins
  profiles?: { full_name: string; avatar_url: string | null };
  subjects?: { name: string };
  applications_count?: number;
  // campos derivados (feed)
  faculty_name?: string;
  subject_name?: string;
}

export interface CreateStudyRequestPayload {
  subject_id: string;
  title: string;
  description: string;
  max_members: number;
}

export interface Application {
  id: string;
  request_id: string;
  applicant_id: string;
  message: string;
  status: ApplicationStatus;
  reviewed_at: string | null;
  created_at: string;
  // joins
  profiles?: { full_name: string; avatar_url: string | null };
  study_requests?: { title: string; status: RequestStatus; subjects?: { name: string } };
}


// Mensajería


export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
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


// Recursos de estudio


export interface StudyResource {
  id: string;
  user_id: string;
  program_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null; // PDF, DOCX, XLSX, etc.
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


// Búsqueda de compañeros


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


// Administración


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


// Eventos del campus


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