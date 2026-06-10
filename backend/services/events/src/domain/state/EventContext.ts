import type { EventState } from "./EventState.js";
import type { EventStatus } from "./EventStatus.js";
import { DraftState } from "./DraftState.js";
import { PublishedState } from "./PublishedState.js";
import { CancelledState } from "./CancelledState.js";
import { FinishedState } from "./FinishedState.js";

export class EventContext {
  constructor(private readonly state: EventState) {}

  static fromStatus(status: EventStatus): EventContext {
    const state = createState(status);
    return new EventContext(state);
  }

  getStatus(): EventStatus {
    return this.state.status;
  }

  canEdit(): boolean {
    return this.state.canEdit();
  }

  canDelete(): boolean {
    return this.state.canDelete();
  }

  publish(eventDate: Date, maxCapacity: number | null): EventContext {
    const newState = this.state.publish(eventDate, maxCapacity);
    return new EventContext(newState);
  }

  cancel(): EventContext {
    const newState = this.state.cancel();
    return new EventContext(newState);
  }

  finish(): EventContext {
    const newState = this.state.finish();
    return new EventContext(newState);
  }
}

function createState(status: EventStatus): EventState {
  switch (status) {
    case "draft":
      return new DraftState();
    case "published":
      return new PublishedState();
    case "cancelled":
      return new CancelledState();
    case "finished":
      return new FinishedState();
  }
}
