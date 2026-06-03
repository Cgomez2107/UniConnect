import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

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
  protected async validar(content: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    if (metadata?.mediaUrl) {
      const mimeType = metadata.mediaType ?? "application/octet-stream";

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return {
          valido: false,
          codigoError: "MediaError",
          mensajeError: `Tipo de archivo no soportado: ${mimeType}. Permitidos: ${ALLOWED_MIME_TYPES.join(", ")}`,
        };
      }

      const filename = metadata.mediaFilename ?? "archivo";
      if (filename.length > MAX_FILENAME_LENGTH) {
        return {
          valido: false,
          codigoError: "MediaError",
          mensajeError: `Nombre de archivo demasiado largo. Máximo ${MAX_FILENAME_LENGTH} caracteres.`,
        };
      }
    }

    return { valido: true };
  }
}