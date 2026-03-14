import type { Application } from "@/types"
import type { IApplicationRepository } from "../../repositories/IApplicationRepository"

export class GetReceivedApplicationsByAuthor {
  constructor(private repository: IApplicationRepository) {}

  async execute(authorId: string): Promise<Application[]> {
    return this.repository.getReceivedByAuthor(authorId)
  }
}
