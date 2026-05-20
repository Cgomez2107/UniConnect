/**
 * Entity-specific Mappers
 * Converts DTOs to Domain types with strict typing
 */

import { snakeToCamel, camelToSnake } from "./index.js";
import { parseStringDatesToObjects, formatDateObjectsToStrings } from "./dateMapper.js";
import type {
  // DTOs
  UserDTO,
  AuthProfileDTO,
  ProfileDTO,
  FacultyDTO,
  ProgramDTO,
  SubjectDTO,
  UserSubjectDTO,
  UserProgramDTO,
  MessageDTO,
  ConversationDTO,
  StudyGroupDTO,
  StudyGroupMemberDTO,
  StudyApplicationDTO,
  NotificationDTO,
  StudyResourceDTO,
  EventDTO,
  LoginResponseDTO,
  OAuthCallbackResponseDTO,
  ForumQuestionDTO,
  ForumAnswerDTO,
  // Domain Types
  User,
  AuthProfile,
  Profile,
  Faculty,
  Program,
  Subject,
  UserSubject,
  UserProgram,
  Message,
  Conversation,
  StudyGroup,
  StudyGroupMember,
  StudyApplication,
  Notification,
  StudyResource,
  Event,
  LoginResponse,
  OAuthCallbackResponse,
  ForumQuestion,
  ForumAnswer,
} from "@uniconnect/shared-types";

/**
 * Map UserDTO to User domain type
 * - Convert snake_case to camelCase
 * - Convert ISO strings to Date objects
 */
export function mapUserDtoToDomain(dto: UserDTO): User {
  const camelCased = snakeToCamel<User>(dto);
  return parseStringDatesToObjects<User>(camelCased);
}

/**
 * Map User domain type to UserDTO
 * - Convert camelCase to snake_case
 * - Convert Date objects to ISO strings
 */
export function mapUserDomainToDto(domain: User): UserDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<UserDTO>(withStrings);
}

/**
 * Map AuthProfileDTO to AuthProfile domain type
 */
export function mapAuthProfileDtoToDomain(dto: AuthProfileDTO): AuthProfile {
  const camelCased = snakeToCamel<AuthProfile>(dto);
  return parseStringDatesToObjects<AuthProfile>(camelCased);
}

/**
 * Map AuthProfile domain type to AuthProfileDTO
 */
export function mapAuthProfileDomainToDto(domain: AuthProfile): AuthProfileDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<AuthProfileDTO>(withStrings);
}

/**
 * Map MessageDTO to Message domain type
 */
export function mapMessageDtoToDomain(dto: MessageDTO): Message {
  const camelCased = snakeToCamel<Message>(dto);
  return parseStringDatesToObjects<Message>(camelCased);
}

// ============================================================================
// Forum Mappers
// ============================================================================

export function mapForumQuestionDtoToDomain(dto: ForumQuestionDTO): ForumQuestion {
  const camelCased = snakeToCamel<ForumQuestion>(dto);
  return parseStringDatesToObjects<ForumQuestion>(camelCased);
}

export function mapForumAnswerDtoToDomain(dto: ForumAnswerDTO): ForumAnswer {
  const camelCased = snakeToCamel<ForumAnswer>(dto);
  return parseStringDatesToObjects<ForumAnswer>(camelCased);
}

/**
 * Map ConversationDTO to Conversation domain type
 */
export function mapConversationDtoToDomain(dto: ConversationDTO): Conversation {
  const camelCased = snakeToCamel<Conversation>(dto);
  return parseStringDatesToObjects<Conversation>(camelCased);
}

/**
 * Map Conversation domain type to ConversationDTO
 */
export function mapConversationDomainToDto(domain: Conversation): ConversationDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<ConversationDTO>(withStrings);
}

/**
 * Map StudyGroupDTO to StudyGroup domain type
 */
export function mapStudyGroupDtoToDomain(dto: StudyGroupDTO): StudyGroup {
  const camelCased = snakeToCamel<StudyGroup>(dto);
  return parseStringDatesToObjects<StudyGroup>(camelCased);
}

/**
 * Map StudyGroup domain type to StudyGroupDTO
 */
export function mapStudyGroupDomainToDto(domain: StudyGroup): StudyGroupDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<StudyGroupDTO>(withStrings);
}

/**
 * Map NotificationDTO to Notification domain type
 */
export function mapNotificationDtoToDomain(dto: Record<string, any>): Notification {
  const withMappedKeys = {
    ...dto,
    data: dto.data ?? dto.payload ?? undefined,
    description: dto.description ?? dto.body ?? undefined,
    actionUrl: dto.actionUrl ?? dto.action_url ?? undefined,
    read: dto.read ?? (dto.readAt != null || dto.read_at != null),
    priority: dto.priority ?? dto.prioridad ?? undefined,
    action: dto.action ?? undefined,
  };
  const camelCased = snakeToCamel<Notification>(withMappedKeys);
  return parseStringDatesToObjects<Notification>(camelCased);
}

/**
 * Map Notification domain type to NotificationDTO
 */
export function mapNotificationDomainToDto(domain: Notification): NotificationDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<NotificationDTO>(withStrings);
}

/**
 * Map LoginResponseDTO to LoginResponse domain type
 */
export function mapLoginResponseDtoToDomain(dto: LoginResponseDTO): LoginResponse {
  const camelCased = snakeToCamel<LoginResponse>(dto);
  return parseStringDatesToObjects<LoginResponse>(camelCased);
}

/**
 * Map OAuthCallbackResponseDTO to OAuthCallbackResponse domain type
 */
export function mapOAuthCallbackResponseDtoToDomain(
  dto: OAuthCallbackResponseDTO
): OAuthCallbackResponse {
  const camelCased = snakeToCamel<OAuthCallbackResponse>(dto);
  return parseStringDatesToObjects<OAuthCallbackResponse>(camelCased);
}

/**
 * Generic response mapper wrapper
 * Applies camelCase conversion and date parsing
 */
export function mapResponseDtoToDomain<TDto, TDomain>(
  dto: TDto
): TDomain {
  const camelCased = snakeToCamel<TDomain>(dto);
  return parseStringDatesToObjects<TDomain>(camelCased);
}

/**
 * Generic request mapper wrapper
 * Applies snake_case conversion and date formatting
 */
export function mapDomainToRequestDto<TDomain, TDto>(
  domain: TDomain
): TDto {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<TDto>(withStrings);
}

// ============================================================================
// Profile Mappers
// ============================================================================

export function mapProfileDtoToDomain(dto: ProfileDTO): Profile {
  const camelCased = snakeToCamel<Profile>(dto);
  return parseStringDatesToObjects<Profile>(camelCased);
}

export function mapProfileDomainToDto(domain: Profile): ProfileDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<ProfileDTO>(withStrings);
}

// ============================================================================
// Faculty Mappers
// ============================================================================

export function mapFacultyDtoToDomain(dto: FacultyDTO): Faculty {
  const camelCased = snakeToCamel<Faculty>(dto);
  return parseStringDatesToObjects<Faculty>(camelCased);
}

export function mapFacultyDomainToDto(domain: Faculty): FacultyDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<FacultyDTO>(withStrings);
}

// ============================================================================
// Program Mappers
// ============================================================================

export function mapProgramDtoToDomain(dto: ProgramDTO): Program {
  const camelCased = snakeToCamel<Program>(dto);
  return parseStringDatesToObjects<Program>(camelCased);
}

export function mapProgramDomainToDto(domain: Program): ProgramDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<ProgramDTO>(withStrings);
}

// ============================================================================
// Subject Mappers
// ============================================================================

export function mapSubjectDtoToDomain(dto: SubjectDTO): Subject {
  const camelCased = snakeToCamel<Subject>(dto);
  return parseStringDatesToObjects<Subject>(camelCased);
}

export function mapSubjectDomainToDto(domain: Subject): SubjectDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<SubjectDTO>(withStrings);
}

// ============================================================================
// UserSubject Mappers
// ============================================================================

export function mapUserSubjectDtoToDomain(dto: UserSubjectDTO): UserSubject {
  const camelCased = snakeToCamel<UserSubject>(dto);
  return parseStringDatesToObjects<UserSubject>(camelCased);
}

export function mapUserSubjectDomainToDto(domain: UserSubject): UserSubjectDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<UserSubjectDTO>(withStrings);
}

// ============================================================================
// UserProgram Mappers
// ============================================================================

export function mapUserProgramDtoToDomain(dto: UserProgramDTO): UserProgram {
  const camelCased = snakeToCamel<UserProgram>(dto);
  return parseStringDatesToObjects<UserProgram>(camelCased);
}

export function mapUserProgramDomainToDto(domain: UserProgram): UserProgramDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<UserProgramDTO>(withStrings);
}

// ============================================================================
// StudyGroupMember Mappers
// ============================================================================

export function mapStudyGroupMemberDtoToDomain(dto: StudyGroupMemberDTO): StudyGroupMember {
  const camelCased = snakeToCamel<StudyGroupMember>(dto);
  return parseStringDatesToObjects<StudyGroupMember>(camelCased);
}

export function mapStudyGroupMemberDomainToDto(domain: StudyGroupMember): StudyGroupMemberDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<StudyGroupMemberDTO>(withStrings);
}

// ============================================================================
// StudyApplication Mappers
// ============================================================================

export function mapStudyApplicationDtoToDomain(dto: StudyApplicationDTO): StudyApplication {
  const camelCased = snakeToCamel<StudyApplication>(dto);
  return parseStringDatesToObjects<StudyApplication>(camelCased);
}

export function mapStudyApplicationDomainToDto(domain: StudyApplication): StudyApplicationDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<StudyApplicationDTO>(withStrings);
}

// ============================================================================
// StudyResource Mappers
// ============================================================================

export function mapStudyResourceDtoToDomain(dto: StudyResourceDTO): StudyResource {
  const camelCased = snakeToCamel<StudyResource>(dto);
  return parseStringDatesToObjects<StudyResource>(camelCased);
}

export function mapStudyResourceDomainToDto(domain: StudyResource): StudyResourceDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<StudyResourceDTO>(withStrings);
}

// ============================================================================
// Event Mappers
// ============================================================================

export function mapEventDtoToDomain(dto: EventDTO): Event {
  const camelCased = snakeToCamel<Event>(dto);
  return parseStringDatesToObjects<Event>(camelCased);
}

export function mapEventDomainToDto(domain: Event): EventDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<EventDTO>(withStrings);
}
