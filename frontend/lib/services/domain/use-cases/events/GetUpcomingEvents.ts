import type { CampusEvent } from "@/types"
import type { IEventRepository } from "../../repositories/IEventRepository"

export class GetUpcomingEvents {
  constructor(private repository: IEventRepository) {}

  async execute(): Promise<CampusEvent[]> {
    return this.repository.getUpcoming()
  }
}
