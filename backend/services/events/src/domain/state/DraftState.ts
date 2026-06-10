import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";
import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { EventState } from "./EventState.js";
import type { EventStatus } from "./EventStatus.js";
import { PublishedState } from "./PublishedState.js";

export class DraftState implements EventState {
  readonly status: EventStatus = "draft";

  publish(eventDate: Date, maxCapacity: number | null): EventState {
    this.validatePublish(eventDate, maxCapacity);
    return new PublishedState();
  }

  cancel(): EventState {
    throw new InvalidStateTransitionError(
      "draft",
      "cancel",
      "No se puede cancelar un evento que aún no ha sido publicado. Use eliminar (soft delete) en su lugar.",
    );
  }

  finish(): EventState {
    throw new InvalidStateTransitionError(
      "draft",
      "finish",
      "No se puede finalizar un evento que aún no ha sido publicado.",
    );
  }

  canEdit(): boolean {
    return true;
  }

  canDelete(): boolean {
    return true;
  }

  private validatePublish(eventDate: Date, maxCapacity: number | null): void {
    if (eventDate <= new Date()) {
      throw new ValidationError(
        "La fecha del evento debe ser futura para poder publicarlo.",
      );
    }

    if (maxCapacity !== null && maxCapacity !== undefined && maxCapacity <= 0) {
      throw new ValidationError(
        "El cupo máximo debe ser mayor a 0. Use null para indicar sin límite.",
      );
    }
  }
}
