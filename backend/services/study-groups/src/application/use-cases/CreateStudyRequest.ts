import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import { StudyGroupSubject, type GroupCreatedEvent } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface CreateStudyRequestInput {
  readonly actorUserId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly description: string;
  readonly maxMembers: number;
}

export class CreateStudyRequest {
  constructor(
    private readonly repository: IStudyRequestRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: CreateStudyRequestInput): Promise<StudyRequest> {
    const subjectId = requireTrimmed(input.subjectId, "subjectId");
    const title = requireTrimmed(input.title, "title");
    const description = requireTrimmed(input.description, "description");

    if (!Number.isInteger(input.maxMembers) || input.maxMembers < 2) {
      throw new Error("maxMembers debe ser un entero mayor o igual a 2.");
    }

    // 1️⃣ Crear el grupo en BD
    const created = await this.repository.create({
      authorId: input.actorUserId,
      subjectId,
      title,
      description,
      maxMembers: input.maxMembers,
    });

    // 2️⃣ Emitir evento de grupo creado
    // Todos los observers registrados recibirán este evento
    const event: GroupCreatedEvent = {
      type: "GroupCreated",
      version: "1.0",
      timestamp: new Date(),
      groupId: created.id,
      authorId: input.actorUserId,
      authorName: "Unknown", // TODO: Traer nombre real del usuario
      title,
      subject: subjectId, // TODO: Traer nombre de materia
      maxMembers: input.maxMembers,
    };

    // Emitir de forma asíncrona (no bloquea retorno)
    this.subject.emit(event).catch((error) => {
      console.error("[CreateStudyRequest] Error emitiendo evento:", error);
      // No relanzar error, el grupo ya fue creado exitosamente
    });

    return created;
  }
}