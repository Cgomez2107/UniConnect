/**
 * Use case: Get event by ID.
 */
import type { CampusEvent } from "@/types"
import type { IEventRepository } from "../../repositories/IEventRepository"

export class GetEventById {
  constructor(private repository: IEventRepository) {}

  async execute(id: string): Promise<CampusEvent | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Event ID is required")
    }

    return this.repository.getById(id)
  }
}
