import type { Application } from "@/types"
import type { IApplicationRepository } from "../../repositories/IApplicationRepository"

export class GetApplicationsByRequest {
  constructor(private repository: IApplicationRepository) {}

  async execute(requestId: string): Promise<Application[]> {
    return this.repository.getByRequest(requestId)
  }
}
