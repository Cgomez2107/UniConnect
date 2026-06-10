import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { EventState } from "./EventState.js";
import type { EventStatus } from "./EventStatus.js";

export class CancelledState implements EventState {
  readonly status: EventStatus = "cancelled";

  publish(_eventDate: Date, _maxCapacity: number | null): EventState {
    throw new InvalidStateTransitionError(
      "cancelled",
      "publish",
      "No se puede publicar un evento cancelado.",
    );
  }

  cancel(): EventState {
    throw new InvalidStateTransitionError(
      "cancelled",
      "cancel",
      "El evento ya se encuentra cancelado.",
    );
  }

  finish(): EventState {
    throw new InvalidStateTransitionError(
      "cancelled",
      "finish",
      "No se puede finalizar un evento cancelado.",
    );
  }

  canEdit(): boolean {
    return false;
  }

  canDelete(): boolean {
    return true;
  }
}
