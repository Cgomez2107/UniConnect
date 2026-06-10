import type { Event, PaginatedResult } from "../entities/Event.js";
import type { EventStatus } from "../state/EventStatus.js";

export interface IEventRepository {
  list(
    page?: number,
    limit?: number,
    includeDeleted?: boolean,
    status?: EventStatus | EventStatus[],
    createdBy?: string,
  ): Promise<PaginatedResult<Event>>;

  getUpcomingEvents(limit?: number): Promise<Event[]>;

  getById(id: string): Promise<Event | null>;

  create(input: {
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt?: string;
    organizerId: string;
    category?: string;
    imageUrl?: string;
    maxCapacity?: number | null;
  }): Promise<Event>;

  update(
    id: string,
    organizerId: string,
    input: Record<string, unknown>,
  ): Promise<Event>;

  updateStatus(id: string, status: EventStatus): Promise<void>;

  softDelete(id: string): Promise<void>;

  getRegisteredUsers(eventId: string): Promise<string[]>;

  registerForEvent(eventId: string, userId: string): Promise<void>;
}
