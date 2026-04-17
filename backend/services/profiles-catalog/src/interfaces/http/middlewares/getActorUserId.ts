import type { IncomingMessage } from "node:http";

/**
 * Extrae el user_id del JWT en el header Authorization
 * Token format: "Bearer {jwt}"
 * El JWT contiene sub (user_id) como claim
 *
 * Nota: en producción usarías jwt.verify() para validar.
 * Para MVP, confiamos en que Supabase ya validó el token en la request anterior.
 */
export function getActorUserId(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];

  try {
    // Decodificar sin verificar (confiamos en que el gateway ya validó)
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8"),
    );
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
