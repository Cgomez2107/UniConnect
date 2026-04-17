import type { Event } from "../entities/Event"
import type { CampusEvent } from "@/types"

/**
 * Interface for Event repository.
 * Defines contract for academic/cultural event data access.
 */
export interface IEventRepository {
  getById(id: string): Promise<CampusEvent | null>
  getUpcoming(): Promise<CampusEvent[]>
  getAllEvents(): Promise<CampusEvent[]>
  create(userId: string, payload: any): Promise<CampusEvent>
  update(eventId: string, userId: string, payload: any): Promise<void>
  delete(eventId: string, userId: string): Promise<void>
  getByAuthor(userId: string): Promise<CampusEvent[]>
  updateStatus(eventId: string, status: string): Promise<void>
}
