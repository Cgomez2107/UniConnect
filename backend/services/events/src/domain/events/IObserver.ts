import type { UniversityEvent } from "./UniversityEvents.js";

export interface IObserver {
  handle(event: UniversityEvent): Promise<void>;
  readonly name: string;
}
