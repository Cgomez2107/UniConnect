import type { Event } from "../entities/Event"
import type { CampusEvent } from "@/types"

/**
 * Interface for Event repository.
 * Defines contract for academic/cultural event data access.
 */
export interface IEventRepository {
  getById(id: string): Promise<CampusEvent | null>
  getUpcoming(): Promise<CampusEvent[]>
  // TODO: Define methods
  // - getById(id: string): Promise<Event | null>
  // - getAll(page?: number, pageSize?: number): Promise<Event[]>
  // - create(event: Event): Promise<void>
  // - update(event: Event): Promise<void>
  // - delete(id: string): Promise<void>
}
