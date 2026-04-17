import type { IApplicationRepository, IStudyRequestRepository } from "../../repositories"
import { UnauthorizedError, NotFoundError } from "../../errors"
import type { Application } from "@/types"

interface GetApplicationsInput {
  requestId: string
  userId: string
}

export class GetApplicationsForRequest {
  constructor(
    private applicationRepository: IApplicationRepository,
    private requestRepository: IStudyRequestRepository
  ) {}

  async execute(input: GetApplicationsInput): Promise<Application[]> {
    const request = await this.requestRepository.getById(input.requestId)
    if (!request) throw new NotFoundError("StudyRequest", input.requestId)

    if (request.author_id !== input.userId) {
      throw new UnauthorizedError("ver solicitudes", "No eres el autor de la solicitud")
    }

    return this.applicationRepository.getByRequest(input.requestId)
  }
}
