import type { IApplicationRepository } from "../../repositories/IApplicationRepository"
import { ValidationError } from "../../errors"
import type { Application } from "@/types"

interface ApplyInput {
  requestId: string
  applicantId: string
  message: string
  applicantName?: string
}

export class ApplyToStudyRequest {
  constructor(private repository: IApplicationRepository) {}

  async execute(input: ApplyInput): Promise<Application> {
    this.validate(input)
    return this.repository.create(input.requestId, input.applicantId, input.message, input.applicantName)
  }

  private validate(input: ApplyInput): void {
    if (!input.requestId?.trim()) throw new ValidationError("El ID de la solicitud es obligatorio")
    if (!input.applicantId?.trim()) throw new ValidationError("El ID del usuario es obligatorio")
    if (!input.message?.trim()) throw new ValidationError("El mensaje es obligatorio")
    if (input.message.length > 500) throw new ValidationError("El mensaje no puede exceder 500 caracteres")
  }
}
