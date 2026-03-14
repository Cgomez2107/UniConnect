import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"
import { ValidationError } from "../../errors"
import type { StudyRequest } from "@/types"

interface CreateStudyRequestInput {
  userId: string
  title: string
  description: string
  subject_id: string
  max_members: number
}

export class CreateStudyRequest {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(input: CreateStudyRequestInput): Promise<StudyRequest> {
    this.validate(input)

    return this.repository.create(input.userId, {
      title: input.title,
      description: input.description,
      subject_id: input.subject_id,
      max_members: input.max_members,
    })
  }

  private validate(input: CreateStudyRequestInput): void {
    if (!input.title?.trim()) throw new ValidationError("El título es obligatorio")
    if (!input.description?.trim()) throw new ValidationError("La descripción es obligatoria")
    if (!input.subject_id) throw new ValidationError("La materia es obligatoria")
    if (input.max_members < 1) throw new ValidationError("El número de miembros debe ser mayor a 0")
    if (input.title.length > 200) throw new ValidationError("El título no puede exceder 200 caracteres")
  }
}
