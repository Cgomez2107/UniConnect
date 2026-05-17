/**
 * API DTOs (Backend Layer - snake_case)
 * These represent the raw data structures from the backend API.
 * They are transformed to camelCase domain types by the Mapper in shared-api.
 */

// ============================================================================
// User & Authentication DTOs
// ============================================================================

export interface UserDTO {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "estudiante" | "admin";
  profile_image_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthProfileDTO extends UserDTO {
  is_onboarded: boolean;
  last_login_at?: string;
}

export interface ProfileDTO extends UserDTO {
  bio?: string;
  phone?: string;
  institution?: string;
  faculty?: string;
  program?: string;
  subjects?: string[];
}

// ============================================================================
// Academic Catalog DTOs
// ============================================================================

export interface FacultyDTO {
  id: string;
  name: string;
  description?: string;
  code: string;
}

export interface ProgramDTO {
  id: string;
  name: string;
  faculty_id: string;
  description?: string;
  code: string;
}

export interface SubjectDTO {
  id: string;
  name: string;
  program_id: string;
  code: string;
  description?: string;
  credits?: number;
}

export interface UserSubjectDTO {
  id: string;
  user_id: string;
  subject_id: string;
  subject: SubjectDTO;
  enrolled_at: string;
}

export interface UserProgramDTO {
  id: string;
  user_id: string;
  program_id: string;
  program: ProgramDTO;
  enrolled_at: string;
}

// ============================================================================
// Study Groups DTOs
// ============================================================================

export interface StudyGroupDTO {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  subject?: SubjectDTO;
  status: "activa" | "inactiva" | "finalizada";
  max_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface StudyGroupMemberDTO {
  id: string;
  group_id: string;
  user_id: string;
  user: UserDTO;
  role: "admin" | "miembro";
  joined_at: string;
}

export interface StudyApplicationDTO {
  id: string;
  group_id: string;
  user_id: string;
  user: UserDTO;
  message: string;
  status: "pendiente" | "aceptada" | "rechazada";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

// ============================================================================
// Messaging DTOs
// ============================================================================

export interface MessageDTO {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: UserDTO;
  content: string;
  type: "text" | "file" | "mention" | "reaction";
  decorations?: MessageDecorationDTO[];
  attachments?: MessageAttachmentDTO[];
  reactions?: MessageReactionDTO[];
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageDecorationDTO {
  type: "mention" | "file" | "reaction";
  data: Record<string, any>;
}

export interface MessageAttachmentDTO {
  id: string;
  type: string;
  url: string;
  name: string;
  size: number;
  mime_type: string;
}

export interface MessageReactionDTO {
  id: string;
  emoji: string;
  user_id: string;
  user?: UserDTO;
  created_at: string;
}

export interface ConversationDTO {
  id: string;
  type: "direct" | "group";
  name?: string;
  description?: string;
  avatar_url?: string;
  participants: UserDTO[];
  last_message?: MessageDTO;
  last_message_at?: string;
  message_count: number;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Notifications DTOs
// ============================================================================

export interface NotificationDTO {
  id: string;
  user_id: string;
  type:
    | "message"
    | "study_group_application"
    | "study_group_accepted"
    | "study_group_rejected"
    | "mention"
    | "friend_request"
    | "system";
  title: string;
  description?: string;
  action_url?: string;
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// Resources DTOs
// ============================================================================

export interface StudyResourceDTO {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  uploader_user_id: string;
  uploader?: UserDTO;
  subject_id: string;
  subject?: SubjectDTO;
  tags: string[];
  view_count: number;
  download_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Events DTOs
// ============================================================================

export interface EventDTO {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  category?: string;
  image_url?: string;
  creator_id: string;
  creator?: UserDTO;
  capacity?: number;
  attendee_count: number;
  is_online: boolean;
  event_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Auth Response DTOs
// ============================================================================

export interface LoginResponseDTO {
  user: AuthProfileDTO;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface OAuthSignInUrlResponseDTO {
  url: string;
  state: string;
}

export interface OAuthCallbackResponseDTO {
  user: AuthProfileDTO;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  is_new_user: boolean;
}
