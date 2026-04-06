import { DtoValidationError } from "./ValidationError.js";

/**
 * Interfaz para reglas de validación de un DTO
 *
 * Ejemplo:
 * ```ts
 * const rules: ValidationRules<CreateStudyGroupDto> = {
 *   subjectId: [required("subjectId"), uuid("subjectId")],
 *   title: [required("title"), minLength("title", 3)],
 *   maxMembers: [numberRange(2, 10, "maxMembers")],
 * };
 * ```
 */
export type ValidationRules<T> = {
  [K in keyof T]?: Array<(value: unknown) => string | null>;
};

/**
 * Ejecuta validación de DTO
 *
 * @param dto - Objeto a validar
 * @param rules - Reglas de validación
 * @throws DtoValidationError si hay errores
 *
 * @example
 * ```ts
 * const createGroupDto = {
 *   subjectId: "123e4567-e89b-12d3-a456-426614174000",
 *   title: "Cálculo 1",
 *   maxMembers: 5,
 * };
 *
 * validateDto(createGroupDto, rules);
 * // ✅ OK si todos los validadores pasan
 * // ❌ Lanza DtoValidationError si alguno falla
 * ```
 */
export function validateDto<T extends object>(
  dto: T,
  rules: ValidationRules<T>,
): void {
  const errors: Record<string, string> = {};
  const dtoRecord = dto as Record<string, unknown>;
  const ruleEntries = Object.entries(rules) as Array<[
    string,
    Array<(value: unknown) => string | null> | undefined,
  ]>;

  for (const [fieldName, validators] of ruleEntries) {
    if (!validators) continue;

    const value = dtoRecord[fieldName];

    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors[fieldName] = error;
        break; // Solo guardar primer error por campo
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new DtoValidationError("Validation failed", errors);
  }
}

/**
 * Versión que retorna booleano (para uso en condicionales)
 */
export function isValidDto<T extends object>(
  dto: T,
  rules: ValidationRules<T>,
): boolean {
  try {
    validateDto(dto, rules);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validación segura que retorna errores en lugar de lanzar
 */
export function validateDtoSafe<T extends object>(
  dto: T,
  rules: ValidationRules<T>,
): { valid: boolean; errors?: Record<string, string> } {
  try {
    validateDto(dto, rules);
    return { valid: true };
  } catch (error) {
    if (error instanceof DtoValidationError) {
      return { valid: false, errors: error.fields };
    }
    throw error;
  }
}
