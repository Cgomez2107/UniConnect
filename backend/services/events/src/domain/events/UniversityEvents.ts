import type { EventCategory } from "../entities/Event.js";

export interface NuevoEventoUniversidadEvent {
  readonly type: "NUEVO_EVENTO";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly eventId: string;
  readonly title: string;
  readonly category: EventCategory;
  readonly message: string;
  readonly payload: {
    eventId: string;
    title: string;
    description: string;
    category: EventCategory;
    location: string;
    startAt: string;
    organizerId: string;
    organizerName?: string;
    imageUrl?: string;
  };
}

export type UniversityEvent = NuevoEventoUniversidadEvent;
export type UniversityEventType = UniversityEvent["type"];
