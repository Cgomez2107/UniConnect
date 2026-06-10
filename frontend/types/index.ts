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

/** Estados del ciclo de vida de administración (State pattern del backend) */
export type GroupState =
  | "Activo"
  | "PendienteTransferencia"
  | "TransferenciaAceptada"
  | "Disuelto"
  | "Bloqueado";

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
  profiles?: { full_name: string; avatar_url: string | null; bio?: string | null };
  subjects?: {
    name: string;
    program_subjects?: Array<{
      programs?: { faculties?: { name: string } | { name: string }[] } | Array<{ faculties?: { name: string } | { name: string }[] }>;
    }>;
  };
  applications_count?: number;
  // campos derivados (feed)
  faculty_name?: string;
  subject_name?: string;
  hasPendingTransfer?: boolean;
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


export interface Reaction {
  emoji: string;
  user_id: string;
}

export interface PollOption {
  text: string;
  votes: string[];
  percentage?: string;
}

export interface PollData {
  question: string;
  options: PollOption[];
  is_open: boolean;
  closes_at: string | null;
  created_at: string;
}

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
  reactions?: Reaction[];
  poll_data?: PollData | null;
  mentions?: { userId: string; displayName: string }[];
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
  type: string;
  url: string;
  file_url: string;
  file_name: string;
  file_type: string | null; // PDF, DOCX, XLSX, etc.
  file_size_kb: number | null;
  resource_type: string | null;
  og_title: string | null;
  og_image: string | null;
  og_description: string | null;
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


// ============================================================================
// D02 — PERFILES CON DECORADORES (Patrón Decorator)
// ============================================================================

/** Perfil base (Criterio 1) — coincide con GET /profiles/:userId sin ?vista=completa */
export interface PerfilBase {
  id: string;
  nombre: string;
  carrera: string;
  semestre: number;
  asignaturasActivas: { id: string; nombre: string }[];
}

/**
 * Decorador: estadísticas del estudiante (Criterio 2)
 * Los nombres coinciden con StatisticsDecorator del backend
 */
export interface IndicadoresEstadisticas {
  gruposBajoAdministracion: number;
  gruposParticipa: number;
  mensajesEnviados: number;
}

/** Una insignia — estructura del BadgesDecorator del backend */
export interface Insignia {
  id: string;
  nombre: string;
  descripcion: string;
  iconoUrl: string;
  fechaObtenida: string;
}

/**
 * Decorador: insignias desbloqueadas (Criterio 3)
 * Aparece en la respuesta cuando se usa ?vista=completa
 */
export interface PerfilConInsignias {
  insignias: Insignia[];
}

/**
 * Decorador: perfil con estadísticas (Criterio 2)
 */
export interface PerfilConEstadisticas {
  indicadores: IndicadoresEstadisticas;
}

/**
 * Perfil completamente decorado — resultado de GET /profiles/:userId?vista=completa
 * Extiende la base y agrega ambos decoradores (Criterio 4)
 */
export interface PerfilCompleto extends PerfilBase, PerfilConEstadisticas, PerfilConInsignias {}

// ============================================================================
// BÚSQUEDA DE COMPAÑEROS (legacy)
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


export type EventCategory = string;

/** Fila de la tabla event_categories (DB) */
export interface EventCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

/** Payload para crear categoria */
export interface CreateEventCategoryPayload {
  name: string;
  description?: string;
}

/** Evento del campus (vista estudiante y admin) */
export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;       // ISO 8601
  location: string | null;
  category: EventCategory;
  category_id: string;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  status?: string;          // draft | published | cancelled | finished
  capacity?: number | null; // max capacity for the event
  isRegistered?: boolean;   // true si el usuario autenticado ya se inscribió
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
  category_id?: string;
  image_url?: string;
  maxCapacity?: number;
}

/** Evento visto desde el panel de admin (con nombre del creador aplanado) */
export interface AdminEvent {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  category: EventCategory;
  category_id: string;
  created_at: string;
  creator_name: string;
  status?: string;          // draft | published | cancelled | finished
  deleted_at?: string | null;
  max_capacity?: number | null;
}


// FORO

export interface ForumQuestion {
  id: string;
  subject_id: string;
  author_id: string;
  title: string;
  body: string;
  status: "active" | "solved";
  answer_count: number;
  vote_count: number;
  user_vote?: "upvote" | "downvote" | null;
  created_at: string;
  updated_at: string;
}

export interface ForumQuestionSummary {
  id: string;
  subject_id: string;
  author_id: string;
  title: string;
  status: "active" | "solved";
  answer_count: number;
  vote_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumAnswer {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  body: string;
  vote_count: number;
  is_solution: boolean;
  is_pinned: boolean;
  user_vote?: "upvote" | "downvote" | null;
  created_at: string;
  updated_at: string;
}

export interface ForumVotePayload {
  target_type: "question" | "answer";
  target_id: string;
  vote_type: "upvote" | "downvote";
}