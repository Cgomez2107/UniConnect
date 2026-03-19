import type { StudyResource } from "../../domain/entities/StudyResource.js";
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";

export interface CreateStudyResourceCommand {
  readonly actorUserId: string;
  readonly programId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly description?: string;
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileType?: string;
  readonly fileSizeKb?: number;
}

export class CreateStudyResource {
  constructor(private readonly repository: IStudyResourceRepository) {}

  async execute(command: CreateStudyResourceCommand): Promise<StudyResource> {
    if (!command.actorUserId.trim()) {
      throw new Error("Token de autenticación requerido.");
    }

    if (!command.subjectId.trim()) {
      throw new Error("subjectId es obligatorio.");
    }

    if (!command.programId.trim()) {
      throw new Error("programId es obligatorio.");
    }

    if (!command.title.trim()) {
      throw new Error("title es obligatorio.");
    }

    if (!command.fileUrl.trim()) {
      throw new Error("fileUrl es obligatorio.");
    }

    if (!command.fileName.trim()) {
      throw new Error("fileName es obligatorio.");
    }

    return this.repository.create({
      userId: command.actorUserId,
      programId: command.programId.trim(),
      subjectId: command.subjectId.trim(),
      title: command.title.trim(),
      description: command.description?.trim(),
      fileUrl: command.fileUrl.trim(),
      fileName: command.fileName.trim(),
      fileType: command.fileType?.trim(),
      fileSizeKb: command.fileSizeKb,
    });
  }
}
