/**
 * Funciones de validación reutilizables
 */

export namespace Validators {
  /**
   * Valida que un valor no esté vacío
   */
  export function required(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined || value === "") {
      return `${fieldName} is required`;
    }
    return null;
  }

  /**
   * Valida que sea email válido
   */
  export function email(value: string, fieldName: string = "email"): string | null {
    if (!value) return null; // required() valida presencia
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${fieldName} must be a valid email`;
    }
    return null;
  }

  /**
   * Valida longitud mínima
   */
  export function minLength(
    value: string | undefined,
    min: number,
    fieldName: string,
  ): string | null {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  }

  /**
   * Valida longitud máxima
   */
  export function maxLength(
    value: string | undefined,
    max: number,
    fieldName: string,
  ): string | null {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  }

  /**
   * Valida que sea número y esté en rango
   */
  export function numberRange(
    value: unknown,
    min: number,
    max: number,
    fieldName: string,
  ): string | null {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} must be a number`;
    }
    if (num < min || num > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  }

  /**
   * Valida que esté en lista de valores permitidos
   */
  export function oneOf(
    value: unknown,
    allowed: unknown[],
    fieldName: string,
  ): string | null {
    if (value === null || value === undefined) return null;
    if (!allowed.includes(value)) {
      return `${fieldName} must be one of: ${allowed.join(", ")}`;
    }
    return null;
  }

  /**
   * Valida que sea UUID válido
   */
  export function uuid(value: string, fieldName: string = "id"): string | null {
    if (!value) return null;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return `${fieldName} must be a valid UUID`;
    }
    return null;
  }
}
