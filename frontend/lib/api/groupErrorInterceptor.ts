const STATE_ERROR_PATTERNS: [RegExp, string][] = [
  [/InvalidStateTransitionError/i,
   "Acción no permitida en el estado actual del grupo."],
  [/grupo está disuelto/i,
   "El grupo está disuelto. No se pueden realizar más acciones."],
  [/grupo está bloqueado/i,
   "El grupo está bloqueado. No se pueden realizar más acciones."],
  [/único administrador|unico administrador/i,
   "Eres el único administrador. Debes transferir el mando antes de salir."],
  [/no hay ninguna transferencia/i,
   "No hay ninguna transferencia pendiente para esta acción."],
  [/ya hay una pendiente/i,
   "Ya existe una transferencia pendiente. Espera a que se resuelva."],
  [/límite de 3 grupos|alcanzó el límite/i,
   "Ya tienes el máximo de grupos activos en esta materia."],
  [/cupo|límite|alcanzado.*integrante|lleno/i,
   "El grupo ha alcanzado su límite de integrantes."],
  [/no eres admin|no tienes permisos/i,
   "No tienes permisos para realizar esta acción."],
  [/no eres el candidato/i,
   "Solo el candidato seleccionado puede responder la transferencia."],
  [/no encontrada|no encontrado/i,
   "El recurso solicitado no existe."],
  [/no es válido|inválido|transición no permitida/i,
   "La acción no es válida para el estado actual del grupo."],
  [/no puedes unirte/i,
   "No puedes unirte al grupo en este momento."],
  [/no estás matriculado/i,
   "No estás matriculado en esta materia."],
  [/MO_001/i,
   "Tu mensaje supera el límite permitido de caracteres (5000)."],
  [/MO_002/i,
   "Tu mensaje contiene palabras que infringen las normas de la comunidad."],
  [/MO_003/i,
   "Has sido bloqueado temporalmente (5 min) por comportamiento de spam."],
];

const GENERIC_ERROR = "Ha ocurrido un error inesperado. Intenta de nuevo.";

export function parseGroupError(error: unknown): string {
  if (!error) return GENERIC_ERROR;

  const rawMessage = extractMessage(error);
  if (!rawMessage) return GENERIC_ERROR;

  for (const [pattern, friendly] of STATE_ERROR_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return friendly;
    }
  }

  return rawMessage;
}

function extractMessage(error: unknown): string | null {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;

    if ("response" in obj && obj.response) {
      const resp = obj.response as Record<string, unknown>;
      const data = resp.data as Record<string, unknown> | undefined;

      if (data?.error && typeof data.error === "string") {
        return data.error;
      }
      if (data?.message && typeof data.message === "string") {
        return data.message;
      }
      if (resp.data && typeof resp.data === "string") {
        return resp.data;
      }
    }

    if ("message" in obj && typeof obj.message === "string") {
      return obj.message;
    }

    if ("error" in obj && typeof obj.error === "string") {
      return obj.error;
    }
  }

  return null;
}
