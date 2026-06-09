import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { EventState } from "./EventState.js";
import type { EventStatus } from "./EventStatus.js";
import { CancelledState } from "./CancelledState.js";
import { FinishedState } from "./FinishedState.js";

export class PublishedState implements EventState {
  readonly status: EventStatus = "published";

  publish(_eventDate: Date, _maxCapacity: number | null): EventState {
    throw new InvalidStateTransitionError(
      "published",
      "publish",
      "El evento ya se encuentra publicado.",
    );
  }

  cancel(): EventState {
    return new CancelledState();
  }

  finish(): EventState {
    return new FinishedState();
  }

  canEdit(): boolean {
    return false;
  }

  canDelete(): boolean {
    return false;
  }
}
