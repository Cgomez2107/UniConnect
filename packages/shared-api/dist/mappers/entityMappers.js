/**
 * Entity-specific Mappers
 * Converts DTOs to Domain types with strict typing
 */
import { snakeToCamel, camelToSnake } from "./index.js";
import { parseStringDatesToObjects, formatDateObjectsToStrings } from "./dateMapper.js";
/**
 * Map UserDTO to User domain type
 * - Convert snake_case to camelCase
 * - Convert ISO strings to Date objects
 */
export function mapUserDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Map User domain type to UserDTO
 * - Convert camelCase to snake_case
 * - Convert Date objects to ISO strings
 */
export function mapUserDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
/**
 * Map AuthProfileDTO to AuthProfile domain type
 */
export function mapAuthProfileDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Map AuthProfile domain type to AuthProfileDTO
 */
export function mapAuthProfileDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
/**
 * Map MessageDTO to Message domain type
 */
export function mapMessageDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
// ============================================================================
// Forum Mappers
// ============================================================================
export function mapForumQuestionDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapForumAnswerDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Map ConversationDTO to Conversation domain type
 */
export function mapConversationDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Map Conversation domain type to ConversationDTO
 */
export function mapConversationDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
/**
 * Map StudyGroupDTO to StudyGroup domain type
 */
export function mapStudyGroupDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Map StudyGroup domain type to StudyGroupDTO
 */
export function mapStudyGroupDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
/**
 * Map NotificationDTO to Notification domain type
 */
export function mapNotificationDtoToDomain(dto) {
    const withMappedKeys = {
        ...dto,
        data: dto.data ?? dto.payload ?? undefined,
        description: dto.description ?? dto.body ?? undefined,
        actionUrl: dto.actionUrl ?? dto.action_url ?? undefined,
        read: dto.read ?? (dto.readAt != null || dto.read_at != null),
        priority: dto.priority ?? dto.prioridad ?? undefined,
        action: dto.action ?? undefined,
    };
    const camelCased = snakeToCamel(withMappedKeys);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Map Notification domain type to NotificationDTO
 */
export function mapNotificationDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
/**
 * Map LoginResponseDTO to LoginResponse domain type
 */
export function mapLoginResponseDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Map OAuthCallbackResponseDTO to OAuthCallbackResponse domain type
 */
export function mapOAuthCallbackResponseDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Generic response mapper wrapper
 * Applies camelCase conversion and date parsing
 */
export function mapResponseDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
/**
 * Generic request mapper wrapper
 * Applies snake_case conversion and date formatting
 */
export function mapDomainToRequestDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// Profile Mappers
// ============================================================================
export function mapProfileDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapProfileDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// Faculty Mappers
// ============================================================================
export function mapFacultyDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapFacultyDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// Program Mappers
// ============================================================================
export function mapProgramDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapProgramDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// Subject Mappers
// ============================================================================
export function mapSubjectDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapSubjectDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// UserSubject Mappers
// ============================================================================
export function mapUserSubjectDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapUserSubjectDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// UserProgram Mappers
// ============================================================================
export function mapUserProgramDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapUserProgramDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// StudyGroupMember Mappers
// ============================================================================
export function mapStudyGroupMemberDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapStudyGroupMemberDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// StudyApplication Mappers
// ============================================================================
export function mapStudyApplicationDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapStudyApplicationDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// StudyResource Mappers
// ============================================================================
export function mapStudyResourceDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapStudyResourceDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
// ============================================================================
// Event Mappers
// ============================================================================
export function mapEventDtoToDomain(dto) {
    const camelCased = snakeToCamel(dto);
    return parseStringDatesToObjects(camelCased);
}
export function mapEventDomainToDto(domain) {
    const withStrings = formatDateObjectsToStrings(domain);
    return camelToSnake(withStrings);
}
//# sourceMappingURL=entityMappers.js.map