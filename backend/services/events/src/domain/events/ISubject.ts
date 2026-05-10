import type { IObserver } from "./IObserver.js";
import type { UniversityEvent } from "./UniversityEvents.js";

export interface ISubject {
  subscribe(observer: IObserver): void;
  unsubscribe(observer: IObserver): void;
  emit(event: UniversityEvent): Promise<void>;
}
