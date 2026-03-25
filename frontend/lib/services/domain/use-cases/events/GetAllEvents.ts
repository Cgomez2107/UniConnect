import type { CampusEvent } from "@/types"
import type { IEventRepository } from "../../repositories/IEventRepository"

export class GetAllEvents {
  constructor(private readonly repository: IEventRepository) {}

  async execute(): Promise<CampusEvent[]> {
    return this.repository.getAllEvents()
  }
}
