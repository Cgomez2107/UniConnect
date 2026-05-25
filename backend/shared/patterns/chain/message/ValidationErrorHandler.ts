import { ValidationErrorMapper } from "./ValidationErrorMapper.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

interface ErrorResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function handleValidationResult(result: ResultadoValidacion): ErrorResponse | null {
  if (result.valido) {
    return null;
  }

  const httpResponse = ValidationErrorMapper.fromCodigoError(
    result.codigoError ?? "ValidationError",
    result.mensajeError ?? "Error de validación",
  );

  return {
    statusCode: httpResponse.statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(httpResponse.body),
  };
}

export function handleValidationError(error: Error): ErrorResponse {
  const httpResponse = ValidationErrorMapper.toHttpResponse(error);

  return {
    statusCode: httpResponse.statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(httpResponse.body),
  };
}

export function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const validationErrorNames = [
    "ValidatorError",
    "SizeError",
    "ContentError",
    "MediaError",
    "PermissionError",
    "MentionError",
    "ValidationError",
  ];

  return validationErrorNames.includes(error.name);
}

export function createValidationErrorHandler() {
  return (
    err: Error,
    req: any,
    res: any,
    next: (err?: Error) => void,
  ): void => {
    if (!isValidationError(err)) {
      return next(err);
    }

    const response = handleValidationError(err);

    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
  };
}