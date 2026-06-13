import type { Event, PaginatedResult, ListEventsFilter } from "../entities/Event.js";
import type { EventStatus } from "../state/EventStatus.js";

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  qrToken: string | null;
  qrHmac: string | null;
  scannedAt: string | null;
  scannedBy: string | null;
  isUsed: boolean;
  createdAt: string;
}

export interface IEventRepository {
  list(filter?: ListEventsFilter): Promise<PaginatedResult<Event>>;

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
  unregisterFromEvent(eventId: string, userId: string): Promise<void>;
  getUserEmail(userId: string): Promise<string | null>;

  getRegistration(eventId: string, userId: string): Promise<EventRegistration | null>;
  getRegistrationByQrToken(token: string): Promise<EventRegistration | null>;
  setQrData(registrationId: string, qrToken: string, qrHmac: string): Promise<void>;
  markQrAsUsed(registrationId: string, scannedBy: string): Promise<void>;
  getRegistrationsByUser(userId: string): Promise<EventRegistration[]>;
  getEventByRegistration(registrationId: string): Promise<Event | null>;
  getUserProfile(userId: string): Promise<{ fullName: string; avatarUrl: string | null } | null>;
}

