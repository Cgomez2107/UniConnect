import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import { MediaError } from "../../../libs/errors/MediaError.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];

const MAX_FILENAME_LENGTH = 200;

export class MediaValidator extends MessageValidator {
  async validate(content: string, metadata?: ValidationMetadata): Promise<void> {
    if (metadata?.mediaUrl) {
      const mimeType = metadata.mediaType ?? "application/octet-stream";

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new MediaError(
          `Tipo de archivo no soportado: ${mimeType}. Permitidos: ${ALLOWED_MIME_TYPES.join(", ")}`,
          "unsupported_type",
        );
      }

      const filename = metadata.mediaFilename ?? "archivo";
      if (filename.length > MAX_FILENAME_LENGTH) {
        throw new MediaError(
          `Nombre de archivo demasiado largo. Máximo ${MAX_FILENAME_LENGTH} caracteres.`,
          "filename_too_long",
        );
      }
    }

    await this.executeNext(content, metadata);
  }
}
