/**
 * Entity-specific Mappers
 * Converts DTOs to Domain types with strict typing
 */
import type { UserDTO, AuthProfileDTO, ProfileDTO, FacultyDTO, ProgramDTO, SubjectDTO, UserSubjectDTO, UserProgramDTO, MessageDTO, ConversationDTO, StudyGroupDTO, StudyGroupMemberDTO, StudyApplicationDTO, NotificationDTO, StudyResourceDTO, EventDTO, LoginResponseDTO, OAuthCallbackResponseDTO, ForumQuestionDTO, ForumAnswerDTO, User, AuthProfile, Profile, Faculty, Program, Subject, UserSubject, UserProgram, Message, Conversation, StudyGroup, StudyGroupMember, StudyApplication, Notification, StudyResource, Event, LoginResponse, OAuthCallbackResponse, ForumQuestion, ForumAnswer } from "@uniconnect/shared-types";
/**
 * Map UserDTO to User domain type
 * - Convert snake_case to camelCase
 * - Convert ISO strings to Date objects
 */
export declare function mapUserDtoToDomain(dto: UserDTO): User;
/**
 * Map User domain type to UserDTO
 * - Convert camelCase to snake_case
 * - Convert Date objects to ISO strings
 */
export declare function mapUserDomainToDto(domain: User): UserDTO;
/**
 * Map AuthProfileDTO to AuthProfile domain type
 */
export declare function mapAuthProfileDtoToDomain(dto: AuthProfileDTO): AuthProfile;
/**
 * Map AuthProfile domain type to AuthProfileDTO
 */
export declare function mapAuthProfileDomainToDto(domain: AuthProfile): AuthProfileDTO;
/**
 * Map MessageDTO to Message domain type
 */
export declare function mapMessageDtoToDomain(dto: MessageDTO): Message;
export declare function mapForumQuestionDtoToDomain(dto: ForumQuestionDTO): ForumQuestion;
export declare function mapForumAnswerDtoToDomain(dto: ForumAnswerDTO): ForumAnswer;
/**
 * Map ConversationDTO to Conversation domain type
 */
export declare function mapConversationDtoToDomain(dto: ConversationDTO): Conversation;
/**
 * Map Conversation domain type to ConversationDTO
 */
export declare function mapConversationDomainToDto(domain: Conversation): ConversationDTO;
/**
 * Map StudyGroupDTO to StudyGroup domain type
 */
export declare function mapStudyGroupDtoToDomain(dto: StudyGroupDTO): StudyGroup;
/**
 * Map StudyGroup domain type to StudyGroupDTO
 */
export declare function mapStudyGroupDomainToDto(domain: StudyGroup): StudyGroupDTO;
/**
 * Map NotificationDTO to Notification domain type
 */
export declare function mapNotificationDtoToDomain(dto: Record<string, any>): Notification;
/**
 * Map Notification domain type to NotificationDTO
 */
export declare function mapNotificationDomainToDto(domain: Notification): NotificationDTO;
/**
 * Map LoginResponseDTO to LoginResponse domain type
 */
export declare function mapLoginResponseDtoToDomain(dto: LoginResponseDTO): LoginResponse;
/**
 * Map OAuthCallbackResponseDTO to OAuthCallbackResponse domain type
 */
export declare function mapOAuthCallbackResponseDtoToDomain(dto: OAuthCallbackResponseDTO): OAuthCallbackResponse;
/**
 * Generic response mapper wrapper
 * Applies camelCase conversion and date parsing
 */
export declare function mapResponseDtoToDomain<TDto, TDomain>(dto: TDto): TDomain;
/**
 * Generic request mapper wrapper
 * Applies snake_case conversion and date formatting
 */
export declare function mapDomainToRequestDto<TDomain, TDto>(domain: TDomain): TDto;
export declare function mapProfileDtoToDomain(dto: ProfileDTO): Profile;
export declare function mapProfileDomainToDto(domain: Profile): ProfileDTO;
export declare function mapFacultyDtoToDomain(dto: FacultyDTO): Faculty;
export declare function mapFacultyDomainToDto(domain: Faculty): FacultyDTO;
export declare function mapProgramDtoToDomain(dto: ProgramDTO): Program;
export declare function mapProgramDomainToDto(domain: Program): ProgramDTO;
export declare function mapSubjectDtoToDomain(dto: SubjectDTO): Subject;
export declare function mapSubjectDomainToDto(domain: Subject): SubjectDTO;
export declare function mapUserSubjectDtoToDomain(dto: UserSubjectDTO): UserSubject;
export declare function mapUserSubjectDomainToDto(domain: UserSubject): UserSubjectDTO;
export declare function mapUserProgramDtoToDomain(dto: UserProgramDTO): UserProgram;
export declare function mapUserProgramDomainToDto(domain: UserProgram): UserProgramDTO;
export declare function mapStudyGroupMemberDtoToDomain(dto: StudyGroupMemberDTO): StudyGroupMember;
export declare function mapStudyGroupMemberDomainToDto(domain: StudyGroupMember): StudyGroupMemberDTO;
export declare function mapStudyApplicationDtoToDomain(dto: StudyApplicationDTO): StudyApplication;
export declare function mapStudyApplicationDomainToDto(domain: StudyApplication): StudyApplicationDTO;
export declare function mapStudyResourceDtoToDomain(dto: StudyResourceDTO): StudyResource;
export declare function mapStudyResourceDomainToDto(domain: StudyResource): StudyResourceDTO;
export declare function mapEventDtoToDomain(dto: EventDTO): Event;
export declare function mapEventDomainToDto(domain: Event): EventDTO;
//# sourceMappingURL=entityMappers.d.ts.map