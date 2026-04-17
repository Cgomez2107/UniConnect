import { ApiStudyRequestRepository } from "../infrastructure/repositories/ApiStudyRequestRepository";
import { ApiApplicationRepository } from "../infrastructure/repositories/ApiApplicationRepository";
import { ApiStudyResourceRepository } from "../infrastructure/repositories/ApiStudyResourceRepository";
import { ApiMessageRepository } from "../infrastructure/repositories/ApiMessageRepository";
import { ApiConversationRepository } from "../infrastructure/repositories/ApiConversationRepository";
import { ApiEventRepository } from "../infrastructure/repositories/ApiEventRepository";
import { ApiStudentRepository } from "../infrastructure/repositories/ApiStudentRepository";
import { ApiFacultyCatalogRepository } from "../infrastructure/repositories/ApiFacultyCatalogRepository";
import { SupabaseStudyGroupRepository } from "../infrastructure/repositories/SupabaseStudyGroupRepository";
import { SupabaseAuthRepository } from "../infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseProfileRepository } from "../infrastructure/repositories/SupabaseProfileRepository";
import { SupabaseResourceUploadRepository } from "../infrastructure/repositories/SupabaseResourceUploadRepository";
import { SupabaseAdminPanelRepository } from "../infrastructure/repositories/SupabaseAdminPanelRepository";
import type { IStudyRequestRepository } from "../domain/repositories/IStudyRequestRepository";
import type { IApplicationRepository } from "../domain/repositories/IApplicationRepository";
import type { IStudyResourceRepository } from "../domain/repositories/IStudyResourceRepository";
import type { IMessageRepository } from "../domain/repositories/IMessageRepository";
import type { IConversationRepository } from "../domain/repositories/IConversationRepository";
import type { IEventRepository } from "../domain/repositories/IEventRepository";
import type { IStudyGroupRepository } from "../domain/repositories/IStudyGroupRepository";
import type { IAuthRepository } from "../domain/repositories/IAuthRepository";
import type { IStudentRepository } from "../domain/repositories/IStudentRepository";
import type { IProfileRepository } from "../domain/repositories/IProfileRepository";
import type { IFacultyCatalogRepository } from "../domain/repositories/IFacultyCatalogRepository";
import type { IResourceUploadRepository } from "../domain/repositories/IResourceUploadRepository";
import type { IAdminPanelRepository } from "../domain/repositories/IAdminPanelRepository";

import { GetFeedRequests } from "../domain/use-cases/study-requests/GetFeedRequests";
import { CreateStudyRequest } from "../domain/use-cases/study-requests/CreateStudyRequest";
import { UpdateStudyRequest } from "../domain/use-cases/study-requests/UpdateStudyRequest";
import { GetStudyRequestById } from "../domain/use-cases/study-requests/GetStudyRequestById";
import { GetStudyRequestsByAuthor } from "../domain/use-cases/study-requests/GetStudyRequestsByAuthor";
import { GetEnrolledSubjectsForUser } from "../domain/use-cases/study-requests/GetEnrolledSubjectsForUser";
import { GetAvailableSubjectsForUser } from "../domain/use-cases/study-requests/GetAvailableSubjectsForUser";
import { UpdateStudyRequestStatus } from "../domain/use-cases/study-requests/UpdateStudyRequestStatus";
import { IsStudyRequestAdmin } from "../domain/use-cases/study-requests/IsStudyRequestAdmin";
import { GetStudyRequestAdmins } from "../domain/use-cases/study-requests/GetStudyRequestAdmins";
import { AssignStudyRequestAdmin } from "../domain/use-cases/study-requests/AssignStudyRequestAdmin";
import { RevokeStudyRequestAdmin } from "../domain/use-cases/study-requests/RevokeStudyRequestAdmin";
import { UpdateStudyRequestContent } from "../domain/use-cases/study-requests/UpdateStudyRequestContent";
import { CancelStudyRequest } from "../domain/use-cases/study-requests/CancelStudyRequest";
import { ApplyToStudyRequest } from "../domain/use-cases/applications/ApplyToStudyRequest";
import { ReviewApplication } from "../domain/use-cases/applications/ReviewApplication";
import { GetApplicationsForRequest } from "../domain/use-cases/applications/GetApplicationsForRequest";
import { GetMyApplicationStatus } from "../domain/use-cases/applications/GetMyApplicationStatus";
import { GetApplicationsByRequest } from "../domain/use-cases/applications/GetApplicationsByRequest";
import { GetReceivedApplicationsByAuthor } from "../domain/use-cases/applications/GetReceivedApplicationsByAuthor";
import { GetApplicationsByApplicant } from "../domain/use-cases/applications/GetApplicationsByApplicant";
import { CancelApplication } from "../domain/use-cases/applications/CancelApplication";
import { GetStudyResourcesBySubject } from "../domain/use-cases/resources/GetStudyResourcesBySubject";
import { UploadStudyResource } from "../domain/use-cases/resources/UploadStudyResource";
import { GetStudyResourcesByUser } from "../domain/use-cases/resources/GetStudyResourcesByUser";
import { GetStudyResourceById } from "../domain/use-cases/resources/GetStudyResourceById";
import { UpdateStudyResource } from "../domain/use-cases/resources/UpdateStudyResource";
import { DeleteStudyResource } from "../domain/use-cases/resources/DeleteStudyResource";
import { GetConversations } from "../domain/use-cases/messaging/GetConversations";
import { GetMessages } from "../domain/use-cases/messaging/GetMessages";
import { SendMessage } from "../domain/use-cases/messaging/SendMessage";
import { GetOrCreateConversation } from "../domain/use-cases/messaging/GetOrCreateConversation";
import { SignInWithPassword } from "../domain/use-cases/auth/SignInWithPassword";
import { SignUpWithPassword } from "../domain/use-cases/auth/SignUpWithPassword";
import { SignOutUser } from "../domain/use-cases/auth/SignOutUser";
import { ClearLocalSession } from "../domain/use-cases/auth/ClearLocalSession";
import { GetCurrentSession } from "../domain/use-cases/auth/GetCurrentSession";
import { GetMyAuthProfile } from "../domain/use-cases/auth/GetMyAuthProfile";
import { SubscribeAuthStateChanges } from "../domain/use-cases/auth/SubscribeAuthStateChanges";
import { GetOAuthSignInUrl } from "../domain/use-cases/auth/GetOAuthSignInUrl";
import { ResolveSessionFromOAuthUrl } from "../domain/use-cases/auth/ResolveSessionFromOAuthUrl";
import { GetAllEvents } from "../domain/use-cases/events/GetAllEvents";
import { GetUpcomingEvents } from "../domain/use-cases/events/GetUpcomingEvents";
import { GetEventById } from "../domain/use-cases/events/GetEventById";
import { SearchStudentsBySubject } from "../domain/use-cases/students/SearchStudentsBySubject";
import { GetStudentPublicProfile } from "../domain/use-cases/students/GetStudentPublicProfile";
import { UploadResourceFromDevice } from "../domain/use-cases/resources/UploadResourceFromDevice";
import { GetProfileByUserId } from "../domain/use-cases/profile/GetProfileByUserId";
import { GetMyPrograms } from "../domain/use-cases/profile/GetMyPrograms";
import { GetMySubjects } from "../domain/use-cases/profile/GetMySubjects";
import { UpdateMyProfile } from "../domain/use-cases/profile/UpdateMyProfile";
import { UploadMyAvatar } from "../domain/use-cases/profile/UploadMyAvatar";
import { AddMySubject } from "../domain/use-cases/profile/AddMySubject";
import { RemoveMySubject } from "../domain/use-cases/profile/RemoveMySubject";
import { SetPrimaryProgram } from "../domain/use-cases/profile/SetPrimaryProgram";
import { GetPrograms } from "../domain/use-cases/faculty-catalog/GetPrograms";
import { GetSubjectsByProgram } from "../domain/use-cases/faculty-catalog/GetSubjectsByProgram";
import { AdminPanelGateway } from "../domain/use-cases/admin/AdminPanelGateway";

/**
 * Contenedor de Inyección de Dependencias (Service Locator / Singleton).
 *
 * Centraliza la instanciación de repositorios y casos de uso, permitiendo
 * intercambiar implementaciones sin modificar pantallas ni hooks.
 *
 * El swap hacia microservicios se realiza aquí: cambiar la clase concreta
 * del repositorio en el getter correspondiente es el único cambio necesario
 * para migrar un dominio completo. El resto de la aplicación es transparente
 * a ese cambio.
 *
 * Estado actual de migración:
 *   - study-groups (solicitudes + postulaciones): ApiStudyRequestRepository, ApiApplicationRepository
 *   - resto de dominios: Supabase directo (pendiente de migración incremental)
 */
export class DIContainer {
  private static instance: DIContainer;

  private studyRequestRepo?: ApiStudyRequestRepository;
  private applicationRepo?: ApiApplicationRepository;
  private resourceRepo?: ApiStudyResourceRepository;
  private messageRepo?: ApiMessageRepository;
  private conversationRepo?: ApiConversationRepository;
  private eventRepo?: ApiEventRepository;
  private studyGroupRepo?: SupabaseStudyGroupRepository;
  private authRepo?: SupabaseAuthRepository;
  private studentRepo?: ApiStudentRepository;
  private profileRepo?: SupabaseProfileRepository;
  private facultyCatalogRepo?: ApiFacultyCatalogRepository;
  private resourceUploadRepo?: SupabaseResourceUploadRepository;
  private adminPanelRepo?: SupabaseAdminPanelRepository;

  private getFeedRequests?: GetFeedRequests;
  private createStudyRequest?: CreateStudyRequest;
  private updateStudyRequest?: UpdateStudyRequest;
  private getStudyRequestById?: GetStudyRequestById;
  private getStudyRequestsByAuthor?: GetStudyRequestsByAuthor;
  private getEnrolledSubjectsForUser?: GetEnrolledSubjectsForUser;
  private getAvailableSubjectsForUser?: GetAvailableSubjectsForUser;
  private updateStudyRequestStatus?: UpdateStudyRequestStatus;
  private isStudyRequestAdmin?: IsStudyRequestAdmin;
  private getStudyRequestAdmins?: GetStudyRequestAdmins;
  private assignStudyRequestAdmin?: AssignStudyRequestAdmin;
  private revokeStudyRequestAdmin?: RevokeStudyRequestAdmin;
  private updateStudyRequestContent?: UpdateStudyRequestContent;
  private cancelStudyRequest?: CancelStudyRequest;
  private applyToStudyRequest?: ApplyToStudyRequest;
  private reviewApplication?: ReviewApplication;
  private getApplicationsForRequest?: GetApplicationsForRequest;
  private getMyApplicationStatus?: GetMyApplicationStatus;
  private getApplicationsByRequest?: GetApplicationsByRequest;
  private getReceivedApplicationsByAuthor?: GetReceivedApplicationsByAuthor;
  private getApplicationsByApplicant?: GetApplicationsByApplicant;
  private cancelApplication?: CancelApplication;
  private getStudyResourcesBySubject?: GetStudyResourcesBySubject;
  private uploadStudyResource?: UploadStudyResource;
  private getStudyResourcesByUser?: GetStudyResourcesByUser;
  private getStudyResourceById?: GetStudyResourceById;
  private updateStudyResource?: UpdateStudyResource;
  private deleteStudyResource?: DeleteStudyResource;
  private getConversations?: GetConversations;
  private getMessages?: GetMessages;
  private sendMessage?: SendMessage;
  private getOrCreateConversation?: GetOrCreateConversation;
  private signInWithPassword?: SignInWithPassword;
  private signUpWithPassword?: SignUpWithPassword;
  private signOutUser?: SignOutUser;
  private clearLocalSession?: ClearLocalSession;
  private getCurrentSession?: GetCurrentSession;
  private getMyAuthProfile?: GetMyAuthProfile;
  private subscribeAuthStateChanges?: SubscribeAuthStateChanges;
  private getOAuthSignInUrl?: GetOAuthSignInUrl;
  private resolveSessionFromOAuthUrl?: ResolveSessionFromOAuthUrl;  // Events
  private getAllEvents?: GetAllEvents
  private getUpcomingEvents?: GetUpcomingEvents;
  private getEventById?: GetEventById;
  private searchStudentsBySubject?: SearchStudentsBySubject;
  private getStudentPublicProfile?: GetStudentPublicProfile;
  private getProfileByUserId?: GetProfileByUserId;
  private getMyPrograms?: GetMyPrograms;
  private getMySubjects?: GetMySubjects;
  private updateMyProfile?: UpdateMyProfile;
  private uploadMyAvatar?: UploadMyAvatar;
  private addMySubject?: AddMySubject;
  private removeMySubject?: RemoveMySubject;
  private setPrimaryProgram?: SetPrimaryProgram;
  private getPrograms?: GetPrograms;
  private getSubjectsByProgram?: GetSubjectsByProgram;
  private uploadResourceFromDevice?: UploadResourceFromDevice;
  private adminPanelGateway?: AdminPanelGateway;

  private constructor() { }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  getStudyRequestRepository(): IStudyRequestRepository {
    if (!this.studyRequestRepo) {
      this.studyRequestRepo = new ApiStudyRequestRepository();
    }
    return this.studyRequestRepo;
  }

  getApplicationRepository(): IApplicationRepository {
    if (!this.applicationRepo) {
      this.applicationRepo = new ApiApplicationRepository();
    }
    return this.applicationRepo;
  }

  getStudyResourceRepository(): IStudyResourceRepository {
    if (!this.resourceRepo) {
      this.resourceRepo = new ApiStudyResourceRepository();
    }
    return this.resourceRepo;
  }

  getMessageRepository(): IMessageRepository {
    if (!this.messageRepo) {
      this.messageRepo = new ApiMessageRepository();
    }
    return this.messageRepo;
  }

  getConversationRepository(): IConversationRepository {
    if (!this.conversationRepo) {
      this.conversationRepo = new ApiConversationRepository();
    }
    return this.conversationRepo;
  }

  getEventRepository(): IEventRepository {
    if (!this.eventRepo) {
      this.eventRepo = new ApiEventRepository();
    }
    return this.eventRepo;
  }

  getStudyGroupRepository(): IStudyGroupRepository {
    if (!this.studyGroupRepo) {
      this.studyGroupRepo = new SupabaseStudyGroupRepository();
    }
    return this.studyGroupRepo;
  }

  getAuthRepository(): IAuthRepository {
    if (!this.authRepo) {
      this.authRepo = new SupabaseAuthRepository();
    }
    return this.authRepo;
  }

  getStudentRepository(): IStudentRepository {
    if (!this.studentRepo) {
      this.studentRepo = new ApiStudentRepository();
    }
    return this.studentRepo;
  }

  getProfileRepository(): IProfileRepository {
    if (!this.profileRepo) {
      this.profileRepo = new SupabaseProfileRepository();
    }
    return this.profileRepo;
  }

  getFacultyCatalogRepository(): IFacultyCatalogRepository {
    if (!this.facultyCatalogRepo) {
      this.facultyCatalogRepo = new ApiFacultyCatalogRepository();
    }
    return this.facultyCatalogRepo;
  }

  getResourceUploadRepository(): IResourceUploadRepository {
    if (!this.resourceUploadRepo) {
      this.resourceUploadRepo = new SupabaseResourceUploadRepository();
    }
    return this.resourceUploadRepo;
  }

  getAdminPanelRepository(): IAdminPanelRepository {
    if (!this.adminPanelRepo) {
      this.adminPanelRepo = new SupabaseAdminPanelRepository();
    }
    return this.adminPanelRepo;
  }

  getGetFeedRequests(): GetFeedRequests {
    if (!this.getFeedRequests) {
      this.getFeedRequests = new GetFeedRequests(this.getStudyRequestRepository());
    }
    return this.getFeedRequests;
  }

  getCreateStudyRequest(): CreateStudyRequest {
    if (!this.createStudyRequest) {
      this.createStudyRequest = new CreateStudyRequest(this.getStudyRequestRepository());
    }
    return this.createStudyRequest;
  }

  getUpdateStudyRequest(): UpdateStudyRequest {
    if (!this.updateStudyRequest) {
      this.updateStudyRequest = new UpdateStudyRequest(this.getStudyRequestRepository());
    }
    return this.updateStudyRequest;
  }

  getGetStudyRequestById(): GetStudyRequestById {
    if (!this.getStudyRequestById) {
      this.getStudyRequestById = new GetStudyRequestById(this.getStudyRequestRepository());
    }
    return this.getStudyRequestById;
  }

  getGetStudyRequestsByAuthor(): GetStudyRequestsByAuthor {
    if (!this.getStudyRequestsByAuthor) {
      this.getStudyRequestsByAuthor = new GetStudyRequestsByAuthor(this.getStudyRequestRepository());
    }
    return this.getStudyRequestsByAuthor;
  }

  getGetEnrolledSubjectsForUser(): GetEnrolledSubjectsForUser {
    if (!this.getEnrolledSubjectsForUser) {
      this.getEnrolledSubjectsForUser = new GetEnrolledSubjectsForUser(this.getStudyRequestRepository());
    }
    return this.getEnrolledSubjectsForUser;
  }

  getGetAvailableSubjectsForUser(): GetAvailableSubjectsForUser {
    if (!this.getAvailableSubjectsForUser) {
      this.getAvailableSubjectsForUser = new GetAvailableSubjectsForUser(this.getStudyRequestRepository());
    }
    return this.getAvailableSubjectsForUser;
  }

  getUpdateStudyRequestStatus(): UpdateStudyRequestStatus {
    if (!this.updateStudyRequestStatus) {
      this.updateStudyRequestStatus = new UpdateStudyRequestStatus(this.getStudyRequestRepository());
    }
    return this.updateStudyRequestStatus;
  }

  getIsStudyRequestAdmin(): IsStudyRequestAdmin {
    if (!this.isStudyRequestAdmin) {
      this.isStudyRequestAdmin = new IsStudyRequestAdmin(this.getStudyRequestRepository());
    }
    return this.isStudyRequestAdmin;
  }

  getGetStudyRequestAdmins(): GetStudyRequestAdmins {
    if (!this.getStudyRequestAdmins) {
      this.getStudyRequestAdmins = new GetStudyRequestAdmins(this.getStudyRequestRepository());
    }
    return this.getStudyRequestAdmins;
  }

  getAssignStudyRequestAdmin(): AssignStudyRequestAdmin {
    if (!this.assignStudyRequestAdmin) {
      this.assignStudyRequestAdmin = new AssignStudyRequestAdmin(this.getStudyRequestRepository());
    }
    return this.assignStudyRequestAdmin;
  }

  getRevokeStudyRequestAdmin(): RevokeStudyRequestAdmin {
    if (!this.revokeStudyRequestAdmin) {
      this.revokeStudyRequestAdmin = new RevokeStudyRequestAdmin(this.getStudyRequestRepository());
    }
    return this.revokeStudyRequestAdmin;
  }

  getUpdateStudyRequestContent(): UpdateStudyRequestContent {
    if (!this.updateStudyRequestContent) {
      this.updateStudyRequestContent = new UpdateStudyRequestContent(this.getStudyRequestRepository());
    }
    return this.updateStudyRequestContent;
  }

  getCancelStudyRequest(): CancelStudyRequest {
    if (!this.cancelStudyRequest) {
      this.cancelStudyRequest = new CancelStudyRequest(this.getStudyRequestRepository());
    }
    return this.cancelStudyRequest;
  }

  getApplyToStudyRequest(): ApplyToStudyRequest {
    if (!this.applyToStudyRequest) {
      this.applyToStudyRequest = new ApplyToStudyRequest(this.getApplicationRepository());
    }
    return this.applyToStudyRequest;
  }

  getReviewApplication(): ReviewApplication {
    if (!this.reviewApplication) {
      this.reviewApplication = new ReviewApplication(
        this.getApplicationRepository(),
        this.getStudyRequestRepository(),
      );
    }
    return this.reviewApplication;
  }

  getGetApplicationsForRequest(): GetApplicationsForRequest {
    if (!this.getApplicationsForRequest) {
      this.getApplicationsForRequest = new GetApplicationsForRequest(
        this.getApplicationRepository(),
        this.getStudyRequestRepository(),
      );
    }
    return this.getApplicationsForRequest;
  }

  getGetMyApplicationStatus(): GetMyApplicationStatus {
    if (!this.getMyApplicationStatus) {
      this.getMyApplicationStatus = new GetMyApplicationStatus(this.getApplicationRepository());
    }
    return this.getMyApplicationStatus;
  }

  getGetApplicationsByRequest(): GetApplicationsByRequest {
    if (!this.getApplicationsByRequest) {
      this.getApplicationsByRequest = new GetApplicationsByRequest(this.getApplicationRepository());
    }
    return this.getApplicationsByRequest;
  }

  getGetReceivedApplicationsByAuthor(): GetReceivedApplicationsByAuthor {
    if (!this.getReceivedApplicationsByAuthor) {
      this.getReceivedApplicationsByAuthor = new GetReceivedApplicationsByAuthor(this.getApplicationRepository());
    }
    return this.getReceivedApplicationsByAuthor;
  }

  getGetApplicationsByApplicant(): GetApplicationsByApplicant {
    if (!this.getApplicationsByApplicant) {
      this.getApplicationsByApplicant = new GetApplicationsByApplicant(this.getApplicationRepository());
    }
    return this.getApplicationsByApplicant;
  }

  getCancelApplication(): CancelApplication {
    if (!this.cancelApplication) {
      this.cancelApplication = new CancelApplication(this.getApplicationRepository());
    }
    return this.cancelApplication;
  }

  getGetStudyResourcesBySubject(): GetStudyResourcesBySubject {
    if (!this.getStudyResourcesBySubject) {
      this.getStudyResourcesBySubject = new GetStudyResourcesBySubject(this.getStudyResourceRepository());
    }
    return this.getStudyResourcesBySubject;
  }

  getUploadStudyResource(): UploadStudyResource {
    if (!this.uploadStudyResource) {
      this.uploadStudyResource = new UploadStudyResource(this.getStudyResourceRepository());
    }
    return this.uploadStudyResource;
  }

  getGetStudyResourcesByUser(): GetStudyResourcesByUser {
    if (!this.getStudyResourcesByUser) {
      this.getStudyResourcesByUser = new GetStudyResourcesByUser(this.getStudyResourceRepository());
    }
    return this.getStudyResourcesByUser;
  }

  getGetStudyResourceById(): GetStudyResourceById {
    if (!this.getStudyResourceById) {
      this.getStudyResourceById = new GetStudyResourceById(this.getStudyResourceRepository());
    }
    return this.getStudyResourceById;
  }

  getUpdateStudyResource(): UpdateStudyResource {
    if (!this.updateStudyResource) {
      this.updateStudyResource = new UpdateStudyResource(this.getStudyResourceRepository());
    }
    return this.updateStudyResource;
  }

  getDeleteStudyResource(): DeleteStudyResource {
    if (!this.deleteStudyResource) {
      this.deleteStudyResource = new DeleteStudyResource(this.getStudyResourceRepository());
    }
    return this.deleteStudyResource;
  }

  getGetConversations(): GetConversations {
    if (!this.getConversations) {
      this.getConversations = new GetConversations(this.getConversationRepository());
    }
    return this.getConversations;
  }

  getGetMessages(): GetMessages {
    if (!this.getMessages) {
      this.getMessages = new GetMessages(this.getMessageRepository());
    }
    return this.getMessages;
  }

  getSendMessage(): SendMessage {
    if (!this.sendMessage) {
      this.sendMessage = new SendMessage(this.getMessageRepository(), this.getConversationRepository());
    }
    return this.sendMessage;
  }

  getGetOrCreateConversation(): GetOrCreateConversation {
    if (!this.getOrCreateConversation) {
      this.getOrCreateConversation = new GetOrCreateConversation(this.getConversationRepository());
    }
    return this.getOrCreateConversation;
  }

  getSignInWithPassword(): SignInWithPassword {
    if (!this.signInWithPassword) {
      this.signInWithPassword = new SignInWithPassword(this.getAuthRepository());
    }
    return this.signInWithPassword;
  }

  getSignUpWithPassword(): SignUpWithPassword {
    if (!this.signUpWithPassword) {
      this.signUpWithPassword = new SignUpWithPassword(this.getAuthRepository());
    }
    return this.signUpWithPassword;
  }

  getSignOutUser(): SignOutUser {
    if (!this.signOutUser) {
      this.signOutUser = new SignOutUser(this.getAuthRepository());
    }
    return this.signOutUser;
  }

  getClearLocalSession(): ClearLocalSession {
    if (!this.clearLocalSession) {
      this.clearLocalSession = new ClearLocalSession(this.getAuthRepository());
    }
    return this.clearLocalSession;
  }

  getGetCurrentSession(): GetCurrentSession {
    if (!this.getCurrentSession) {
      this.getCurrentSession = new GetCurrentSession(this.getAuthRepository());
    }
    return this.getCurrentSession;
  }

  getGetMyAuthProfile(): GetMyAuthProfile {
    if (!this.getMyAuthProfile) {
      this.getMyAuthProfile = new GetMyAuthProfile(this.getAuthRepository());
    }
    return this.getMyAuthProfile;
  }

  getSubscribeAuthStateChanges(): SubscribeAuthStateChanges {
    if (!this.subscribeAuthStateChanges) {
      this.subscribeAuthStateChanges = new SubscribeAuthStateChanges(this.getAuthRepository());
    }
    return this.subscribeAuthStateChanges;
  }

  getGetOAuthSignInUrl(): GetOAuthSignInUrl {
    if (!this.getOAuthSignInUrl) {
      this.getOAuthSignInUrl = new GetOAuthSignInUrl(this.getAuthRepository());
    }
    return this.getOAuthSignInUrl;
  }

  getResolveSessionFromOAuthUrl(): ResolveSessionFromOAuthUrl {
    if (!this.resolveSessionFromOAuthUrl) {
      this.resolveSessionFromOAuthUrl = new ResolveSessionFromOAuthUrl(this.getAuthRepository());
    }
    return this.resolveSessionFromOAuthUrl;
  }

  getGetAllEvents(): GetAllEvents {
    if (!this.getAllEvents) {
      this.getAllEvents = new GetAllEvents(this.getEventRepository());
    }
    return this.getAllEvents;
  }

  getGetUpcomingEvents(): GetUpcomingEvents {
    if (!this.getUpcomingEvents) {
      this.getUpcomingEvents = new GetUpcomingEvents(this.getEventRepository());
    }
    return this.getUpcomingEvents;
  }

  getGetEventById(): GetEventById {
    if (!this.getEventById) {
      this.getEventById = new GetEventById(this.getEventRepository());
    }
    return this.getEventById;
  }

  getSearchStudentsBySubject(): SearchStudentsBySubject {
    if (!this.searchStudentsBySubject) {
      this.searchStudentsBySubject = new SearchStudentsBySubject(this.getStudentRepository());
    }
    return this.searchStudentsBySubject;
  }

  getGetStudentPublicProfile(): GetStudentPublicProfile {
    if (!this.getStudentPublicProfile) {
      this.getStudentPublicProfile = new GetStudentPublicProfile(this.getStudentRepository());
    }
    return this.getStudentPublicProfile;
  }

  getGetProfileByUserId(): GetProfileByUserId {
    if (!this.getProfileByUserId) {
      this.getProfileByUserId = new GetProfileByUserId(this.getProfileRepository());
    }
    return this.getProfileByUserId;
  }

  getGetMyPrograms(): GetMyPrograms {
    if (!this.getMyPrograms) {
      this.getMyPrograms = new GetMyPrograms(this.getProfileRepository());
    }
    return this.getMyPrograms;
  }

  getGetMySubjects(): GetMySubjects {
    if (!this.getMySubjects) {
      this.getMySubjects = new GetMySubjects(this.getProfileRepository());
    }
    return this.getMySubjects;
  }

  getUpdateMyProfile(): UpdateMyProfile {
    if (!this.updateMyProfile) {
      this.updateMyProfile = new UpdateMyProfile(this.getProfileRepository());
    }
    return this.updateMyProfile;
  }

  getUploadMyAvatar(): UploadMyAvatar {
    if (!this.uploadMyAvatar) {
      this.uploadMyAvatar = new UploadMyAvatar(this.getProfileRepository());
    }
    return this.uploadMyAvatar;
  }

  getAddMySubject(): AddMySubject {
    if (!this.addMySubject) {
      this.addMySubject = new AddMySubject(this.getProfileRepository());
    }
    return this.addMySubject;
  }

  getRemoveMySubject(): RemoveMySubject {
    if (!this.removeMySubject) {
      this.removeMySubject = new RemoveMySubject(this.getProfileRepository());
    }
    return this.removeMySubject;
  }

  getSetPrimaryProgram(): SetPrimaryProgram {
    if (!this.setPrimaryProgram) {
      this.setPrimaryProgram = new SetPrimaryProgram(this.getProfileRepository());
    }
    return this.setPrimaryProgram;
  }

  getGetPrograms(): GetPrograms {
    if (!this.getPrograms) {
      this.getPrograms = new GetPrograms(this.getFacultyCatalogRepository());
    }
    return this.getPrograms;
  }

  getGetSubjectsByProgram(): GetSubjectsByProgram {
    if (!this.getSubjectsByProgram) {
      this.getSubjectsByProgram = new GetSubjectsByProgram(this.getFacultyCatalogRepository());
    }
    return this.getSubjectsByProgram;
  }

  getUploadResourceFromDevice(): UploadResourceFromDevice {
    if (!this.uploadResourceFromDevice) {
      this.uploadResourceFromDevice = new UploadResourceFromDevice(this.getResourceUploadRepository());
    }
    return this.uploadResourceFromDevice;
  }

  getAdminPanelGateway(): AdminPanelGateway {
    if (!this.adminPanelGateway) {
      this.adminPanelGateway = new AdminPanelGateway(this.getAdminPanelRepository());
    }
    return this.adminPanelGateway;
  }
}