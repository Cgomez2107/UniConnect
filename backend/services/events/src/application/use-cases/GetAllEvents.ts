import type { Event, PaginatedResult, ListEventsFilter } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { EventStatus } from "../../domain/state/EventStatus.js";

export class GetAllEvents {
  constructor(private readonly repository: IEventRepository) {}

  async execute(
    page?: number,
    limit?: number,
    includeDeleted?: boolean,
    status?: EventStatus | EventStatus[],
    createdBy?: string,
  ): Promise<PaginatedResult<Event>> {
    const filter: ListEventsFilter = {
      page,
      limit,
      includeDeleted,
      status,
      createdBy,
    };
    return this.repository.list(filter);
  }
}