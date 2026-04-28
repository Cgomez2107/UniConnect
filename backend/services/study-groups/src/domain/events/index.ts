/**
 * Barrel exports para el módulo de events
 * Permite importaciones limpias:
 * import { StudyGroupSubject, NotificationObserver } from "domain/events"
 */

export * from "./StudyGroupEvents.js";
export { StudyGroupSubject } from "./observers/StudyGroupSubject.js";
export type { IObserver } from "./observers/IObserver.js";
export { NotificationObserver, type INotificationRepository } from "./observers/NotificationObserver.js";
