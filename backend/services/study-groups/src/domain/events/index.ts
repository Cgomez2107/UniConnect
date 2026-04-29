/**
 * Barrel exports para el módulo de events
 * Permite importaciones limpias:
 * import { StudyGroupSubject, NotificationObserver } from "domain/events"
 */

export * from "./StudyGroupEvents.js";
export { StudyGroupSubject } from "./observers/StudyGroupSubject.js";
export type { IObserver } from "./observers/IObserver.js";
export type { ISubject } from "./observers/ISubject.js";
export { NotificationObserver } from "./observers/NotificationObserver.js";
export {
	WebSocketNotificationObserver,
	type IStudyGroupSocketGateway,
} from "./observers/WebSocketNotificationObserver.js";
