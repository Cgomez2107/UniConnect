/**
 * ISubject.ts
 *
 * Contrato para subjects del dominio de study-groups.
 */

import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";

export interface ISubject {
  subscribe(observer: IObserver): void;
  unsubscribe(observer: IObserver): void;
  emit(event: StudyGroupEvent): Promise<void>;
}
