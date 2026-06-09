import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { EventState } from "./EventState.js";
import type { EventStatus } from "./EventStatus.js";

export class FinishedState implements EventState {
  readonly status: EventStatus = "finished";

  publish(_eventDate: Date, _maxCapacity: number | null): EventState {
    throw new InvalidStateTransitionError(
      "finished",
      "publish",
      "No se puede publicar un evento finalizado.",
    );
  }

  cancel(): EventState {
    throw new InvalidStateTransitionError(
      "finished",
      "cancel",
      "No se puede cancelar un evento finalizado.",
    );
  }

  finish(): EventState {
    throw new InvalidStateTransitionError(
      "finished",
      "finish",
      "El evento ya se encuentra finalizado.",
    );
  }

  canEdit(): boolean {
    return false;
  }

  canDelete(): boolean {
    return true;
  }
}
