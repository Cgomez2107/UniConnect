import type { IApplicationRepository, IStudyRequestRepository } from "../../repositories"
import { UnauthorizedError, NotFoundError, ValidationError } from "../../errors"

interface ReviewInput {
  applicationId: string
  reviewerId: string
  decision: "aceptada" | "rechazada"
}

export class ReviewApplication {
  constructor(
    private applicationRepository: IApplicationRepository,
    private requestRepository: IStudyRequestRepository
  ) {}

  async execute(input: ReviewInput): Promise<void> {
    const application = await this.applicationRepository.getById(input.applicationId)
    if (!application) throw new NotFoundError("Application", input.applicationId)

    const request = await this.requestRepository.getById(application.request_id)
    if (!request) throw new NotFoundError("StudyRequest", application.request_id)

    if (request.author_id !== input.reviewerId) {
      throw new UnauthorizedError("revisar solicitud", "No eres el autor de la solicitud")
    }

    await this.applicationRepository.update(input.applicationId, input.decision)
  }
}
