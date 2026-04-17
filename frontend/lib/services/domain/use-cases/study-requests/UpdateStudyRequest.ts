import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"
import { UnauthorizedError, NotFoundError, ValidationError } from "../../errors"
import type { StudyRequest } from "@/types"

interface UpdateStudyRequestInput {
  requestId: string
  userId: string
  title?: string
  description?: string
}

export class UpdateStudyRequest {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(input: UpdateStudyRequestInput): Promise<void> {
    const request = await this.repository.getById(input.requestId)
    if (!request) throw new NotFoundError("StudyRequest", input.requestId)
    if (request.author_id !== input.userId) throw new UnauthorizedError("editar solicitud", "No eres el autor")

    const payload: { title?: string; description?: string } = {}
    if (input.title) payload.title = input.title.trim()
    if (input.description) payload.description = input.description.trim()

    this.validatePayload(payload)
    await this.repository.updateContent(input.requestId, input.userId, payload)
  }

  private validatePayload(payload: { title?: string; description?: string }): void {
    if (payload.title && payload.title.length > 200) throw new ValidationError("El título no puede exceder 200 caracteres")
    if (payload.description && payload.description.length > 2000) throw new ValidationError("La descripción no puede exceder 2000 caracteres")
  }
}
