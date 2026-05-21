export type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
export type { IPreferenceService } from "./IPreferenceService.js";
export type { IPreferenceRepository } from "./IPreferenceRepository.js";
export type { INotificationPreferenceRepository } from "./INotificationPreferenceRepository.js";
export type { IUserRepository, ContactInfo } from "./IUserRepository.js";
export { NotificationService, type ResumenNotificacion, type NotificationResult } from "./NotificationService.js";
export {
  InAppWebSocketStrategy,
  type IStudyGroupSocketGateway,
} from "./InAppWebSocketStrategy.js";
export {
  EmailInstitucionalStrategy,
  type IEmailGateway,
} from "./EmailInstitucionalStrategy.js";
export {
  PushMovilStrategy,
  type IPushGateway,
} from "./PushMovilStrategy.js";
