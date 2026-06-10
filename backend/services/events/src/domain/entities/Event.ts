import type { EventStatus as LifecycleStatus } from "../state/EventStatus.js";

export type EventCategory = string;

export interface Event {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly organizerId: string;
  readonly organizerName?: string;
  readonly category: EventCategory;
  readonly categoryId: string;
  readonly imageUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: LifecycleStatus;
  readonly maxCapacity: number | null;
  readonly registeredCount: number;
  readonly deletedAt: string | null;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
