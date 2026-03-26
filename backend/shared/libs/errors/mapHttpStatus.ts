import type { ApplicationError } from "./ApplicationError.js";

/**
 * Mapea cualquier error a { statusCode, message }
 * Sin usar regex - únicamente por tipo de error
 */
export function mapErrorToHttpStatus(error: unknown): {
  statusCode: number;
  message: string;
} {
  // ✅ Si es error tipado de aplicación
  if (error instanceof Error && "statusCode" in error) {
    const appError = error as ApplicationError;
    return {
      statusCode: appError.statusCode,
      message: appError.message,
    };
  }

  // ✅ Error genérico de Node
  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: error.message || "Internal server error",
    };
  }

  // ✅ Error desconocido
  return {
    statusCode: 500,
    message: "Unknown error",
  };
}
