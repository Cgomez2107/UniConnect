export type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
export type { IPreferenceService } from "./IPreferenceService.js";
export type { IPreferenceRepository } from "./IPreferenceRepository.js";
export { NotificationService, type ResumenNotificacion } from "./NotificationService.js";
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
