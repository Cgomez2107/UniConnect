import type { Event, PaginatedResult } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { EventStatus } from "../../domain/state/EventStatus.js";

export class GetAllEvents {
  constructor(private readonly repository: IEventRepository) {}

  async execute(
    page?: number,
    limit?: number,
    includeDeleted?: boolean,
    status?: EventStatus,
  ): Promise<PaginatedResult<Event>> {
    return this.repository.list(page, limit, includeDeleted, status);
  }
}