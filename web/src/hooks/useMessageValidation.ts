/**
 * Hook para validación de mensajes en tiempo real
 * Valida el contenido del mensaje según la cadena de responsabilidad del backend
 *
 * Propósito:
 * - Dar feedback inmediato al usuario sobre errores de validación
 * - Mostrar advertencias (ej: "te acercas al límite de caracteres")
 * - Deshabilitar botón de envío si hay errores
 * - Traducir códigos de error a mensajes amigables
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ValidationState,
  ValidationErrorCode,
  ValidationErrorMessages,
  ValidatorError,
} from "@uniconnect/shared-types";

interface UseMessageValidationOptions {
  maxLength?: number;
  debounceMs?: number;
  onValidationChange?: (state: ValidationState) => void;
}

/**
 * Máximos y límites de validación (deben coincidir con backend)
 */
const VALIDATION_LIMITS = {
  MAX_MESSAGE_LENGTH: 5000,
  WARN_LENGTH_THRESHOLD: 4500, // Advertir cuando falta 500 caracteres
  FILENAME_MAX_LENGTH: 255,
  FILE_MAX_SIZE_MB: 10,
};

/**
 * Palabras prohibidas (sincronizar con backend)
 * En producción, esto vendría del backend
 */
const FORBIDDEN_WORDS = [
  "spam",
  "violencia",
  "odio",
  "racismo",
  "discriminación",
  "pornografía",
  "drogas",
  "armas",
];

const FORBIDDEN_WORDS_REGEX = FORBIDDEN_WORDS.map(
  (word) => new RegExp(escapeRegex(word), "gi")
);

/**
 * Hook para validación de mensajes con debounce
 */
export function useMessageValidation(
  options: UseMessageValidationOptions = {}
): {
  validationState: ValidationState;
  validateMessage: (content: string) => Promise<ValidationState>;
  clearValidation: () => void;
} {
  const {
    maxLength = VALIDATION_LIMITS.MAX_MESSAGE_LENGTH,
    debounceMs = 300,
    onValidationChange,
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    isValid: true,
    suggestions: [],
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Valida el contenido del mensaje
   */
  const validateMessage = useCallback(
    async (content: string): Promise<ValidationState> => {
      // Limpiar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Validación básica inmediata (sin debounce)
      const basicValidation = performBasicValidation(content, maxLength);
      if (!basicValidation.isValid) {
        setValidationState(basicValidation);
        onValidationChange?.(basicValidation);
        return basicValidation;
      }

      // Validación avanzada con debounce
      setValidationState((prev) => ({
        ...prev,
        isValidating: true,
      }));

      return new Promise<ValidationState>((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          try {
            const advancedValidation = await performAdvancedValidation(
              content
            );
            setValidationState(advancedValidation);
            onValidationChange?.(advancedValidation);
            resolve(advancedValidation);
          } catch (error) {
            // En caso de error en validación avanzada, aceptar mensaje
            const safeState: ValidationState = {
              isValidating: false,
              isValid: true,
              suggestions: [],
            };
            setValidationState(safeState);
            onValidationChange?.(safeState);
            resolve(safeState);
          }
        }, debounceMs);
      });
    },
    [maxLength, debounceMs, onValidationChange]
  );

  /**
   * Limpia el estado de validación
   */
  const clearValidation = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setValidationState({
      isValidating: false,
      isValid: true,
      suggestions: [],
    });
  }, []);

  // Cleanup en desmontaje
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    validationState,
    validateMessage,
    clearValidation,
  };
}

/**
 * Validación básica síncrona (sin llamadas a API)
 */
function performBasicValidation(
  content: string,
  maxLength: number
): ValidationState {
  const trimmed = content.trim();

  // Mensaje vacío (si no hay adjuntos, sería error)
  if (!trimmed) {
    return {
      isValidating: false,
      isValid: true, // Se valida cuando se intenta enviar
      suggestions: [],
    };
  }

  // Mensaje muy largo
  if (trimmed.length > maxLength) {
    return {
      isValidating: false,
      isValid: false,
      error: {
        code: ValidationErrorCode.MESSAGE_TOO_LONG,
        message: ValidationErrorMessages[
          ValidationErrorCode.MESSAGE_TOO_LONG
        ],
        details: {
          maxLength,
          currentLength: trimmed.length,
          excess: trimmed.length - maxLength,
        },
      },
      suggestions: [],
    };
  }

  // Advertencia: cerca del límite
  const warnings = [];
  if (
    trimmed.length >
    VALIDATION_LIMITS.WARN_LENGTH_THRESHOLD
  ) {
    warnings.push({
      type: "length" as const,
      message: `Te quedan ${maxLength - trimmed.length} caracteres`,
      severity: "warning" as const,
    });
  }

  // Detección de palabras prohibidas
  if (isForbiddenContent(trimmed)) {
    return {
      isValidating: false,
      isValid: false,
      error: {
        code: ValidationErrorCode.BANNED_CONTENT,
        message: ValidationErrorMessages[ValidationErrorCode.BANNED_CONTENT],
      },
      suggestions: [],
    };
  }

  return {
    isValidating: false,
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    suggestions: [],
  };
}

export function isForbiddenContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  for (const pattern of FORBIDDEN_WORDS_REGEX) {
    pattern.lastIndex = 0;
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  return false;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validación avanzada asíncrona
 * En versión completa, llamaría al backend para validaciones adicionales
 */
async function performAdvancedValidation(
  content: string
): Promise<ValidationState> {
  // Por ahora, no hay validación avanzada en cliente
  // En el futuro, se podría:
  // 1. Llamar a /api/v1/messages/validate?content=...
  // 2. Validar menciones @usuario contra lista de usuarios
  // 3. Verificar si el usuario está bloqueado

  return {
    isValidating: false,
    isValid: true,
    suggestions: [],
  };
}

/**
 * Hook para validar archivos adjuntos
 */
export function useFileValidation(
  options: { maxSizeMb?: number } = {}
): {
  validateFile: (file: File) => Promise<{
    isValid: boolean;
    error?: string;
  }>;
} {
  const { maxSizeMb = VALIDATION_LIMITS.FILE_MAX_SIZE_MB } = options;

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
  ];

  const validateFile = useCallback(
    async (
      file: File
    ): Promise<{
      isValid: boolean;
      error?: string;
    }> => {
      // Validar tipo
      if (!allowedMimeTypes.includes(file.type)) {
        return {
          isValid: false,
          error: ValidationErrorMessages[
            ValidationErrorCode.UNSUPPORTED_FILE_TYPE
          ],
        };
      }

      // Validar tamaño
      const sizeInMb = file.size / (1024 * 1024);
      if (sizeInMb > maxSizeMb) {
        return {
          isValid: false,
          error: ValidationErrorMessages[ValidationErrorCode.FILE_TOO_LARGE],
        };
      }

      // Validar nombre
      if (file.name.length > VALIDATION_LIMITS.FILENAME_MAX_LENGTH) {
        return {
          isValid: false,
          error: ValidationErrorMessages[
            ValidationErrorCode.FILENAME_TOO_LONG
          ],
        };
      }

      return { isValid: true };
    },
    []
  );

  return { validateFile };
}
