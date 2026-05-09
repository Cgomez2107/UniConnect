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
  MessageDTO,
  ConversationDTO,
  StudyGroupDTO,
  NotificationDTO,
  LoginResponseDTO,
  OAuthCallbackResponseDTO,
  // Domain Types
  User,
  AuthProfile,
  Message,
  Conversation,
  StudyGroup,
  Notification,
  LoginResponse,
  OAuthCallbackResponse,
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

/**
 * Map Message domain type to MessageDTO
 */
export function mapMessageDomainToDto(domain: Message): MessageDTO {
  const withStrings = formatDateObjectsToStrings<Record<string, any>>(domain);
  return camelToSnake<MessageDTO>(withStrings);
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
export function mapNotificationDtoToDomain(dto: NotificationDTO): Notification {
  const camelCased = snakeToCamel<Notification>(dto);
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
