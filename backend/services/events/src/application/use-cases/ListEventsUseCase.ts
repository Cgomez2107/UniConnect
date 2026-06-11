import type { Event, PaginatedResult, ListEventsFilter } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

export class ListEventsUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(filter?: ListEventsFilter): Promise<PaginatedResult<Event>> {
    return this.repository.list(filter);
  }
}