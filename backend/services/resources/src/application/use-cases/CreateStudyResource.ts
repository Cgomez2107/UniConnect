import type { StudyResource } from "../../domain/entities/StudyResource.js";
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";
import type { IOpenGraphService } from "../../domain/services/IOpenGraphService.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";

export interface CreateStudyResourceCommand {
  readonly actorUserId: string;
  readonly programId: string;
  readonly subjectId: string;
  readonly resourceType: string;
  readonly title: string;
  readonly description?: string;
  readonly url?: string;
  readonly fileUrl?: string;
  readonly fileName?: string;
  readonly fileType?: string;
  readonly fileSizeKb?: number;
  readonly ogTitle?: string;
  readonly ogImage?: string;
  readonly ogDescription?: string;
}

export class CreateStudyResource {
  constructor(
    private readonly repository: IStudyResourceRepository,
  private readonly openGraphService?: IOpenGraphService,
  ) {}

  async execute(command: CreateStudyResourceCommand): Promise<StudyResource> {
    if (!command.actorUserId.trim()) {
      throw new ValidationError("Token de autenticación requerido.");
    }

    if (!command.subjectId.trim()) {
      throw new ValidationError("subjectId es obligatorio.");
    }

    if (!command.programId.trim()) {
      throw new ValidationError("programId es obligatorio.");
    }

    if (!command.title.trim()) {
      throw new ValidationError("title es obligatorio.");
    }

    if (command.resourceType === 'link') {
      if (!command.url?.trim()) {
        throw new ValidationError("url es obligatorio para recursos tipo link.");
      }

      let ogTitle: string | undefined;
      let ogDescription: string | undefined;
      let ogImage: string | undefined;

      if (this.openGraphService) {
        try {
          const ogResult = await this.openGraphService.scrape(command.url);
          ogTitle = ogResult.ogTitle ?? undefined;
          ogDescription = ogResult.ogDescription ?? undefined;
          ogImage = ogResult.ogImage ?? undefined;
        } catch {
          // Si falla el scrapeo, se crea el recurso sin metadatos OG
        }
      }

      return     this.repository.create({
        userId: command.actorUserId,
        programId: command.programId.trim(),
        subjectId: command.subjectId.trim(),
        resourceType: command.resourceType,
        title: command.title.trim(),
        description: command.description?.trim(),
        url: command.url.trim(),
        ogTitle,
        ogDescription,
        ogImage,
        ogScrapedAt: new Date().toISOString(),
      });
    }

    if (!command.fileUrl?.trim()) {
      throw new ValidationError("fileUrl es obligatorio.");
    }

    if (!command.fileName?.trim()) {
      throw new ValidationError("fileName es obligatorio.");
    }

    return this.repository.create({
      userId: command.actorUserId,
      programId: command.programId.trim(),
      subjectId: command.subjectId.trim(),
      resourceType: command.resourceType,
      title: command.title.trim(),
      description: command.description?.trim(),
      fileUrl: command.fileUrl.trim(),
      fileName: command.fileName.trim(),
      fileType: command.fileType?.trim(),
      fileSizeKb: command.fileSizeKb,
      ogTitle: command.ogTitle?.trim(),
      ogImage: command.ogImage?.trim(),
      ogDescription: command.ogDescription?.trim(),
    });
  }
}
