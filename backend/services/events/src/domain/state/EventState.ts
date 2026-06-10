import type { EventStatus } from "./EventStatus.js";

export interface EventState {
  readonly status: EventStatus;

  publish(eventDate: Date, maxCapacity: number | null): EventState;

  cancel(): EventState;

  finish(): EventState;

  canEdit(): boolean;

  canDelete(): boolean;
}
