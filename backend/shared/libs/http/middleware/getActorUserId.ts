import type { IncomingMessage } from "node:http";

/**
 * Extrae el identificador del usuario autenticado a partir de la solicitud entrante.
 *
 * Estrategia de resolución en orden de prioridad:
 *   1. Header `x-user-id` inyectado por el API Gateway tras validar el JWT centralmente.
 *   2. Claim `sub` del JWT Bearer decodificado desde el header `Authorization`.
 *
 * La decodificación del JWT es sin verificación de firma; la integridad del token
 * debe validarse en la capa de gateway antes de que la solicitud llegue a este servicio.
 * En una fase posterior, la validación completa se realizará con JWKS vía `jose`.
 */
export function getActorUserId(req: IncomingMessage): string | null {
  const userIdHeader = req.headers["x-user-id"];
  if (typeof userIdHeader === "string" && userIdHeader.trim().length > 0) {
    return userIdHeader.trim();
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    return typeof payload.sub === "string" && payload.sub.trim().length > 0
      ? payload.sub.trim()
      : null;
  } catch {
    return null;
  }
}
