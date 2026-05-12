import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import { MediaError } from "../../../libs/errors/MediaError.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
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
