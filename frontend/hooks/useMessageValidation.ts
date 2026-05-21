/**
 * Hook para validación de mensajes en React Native
 * Versión mobile del hook useMessageValidation de Web
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ValidationState,
  ValidationErrorCode,
  ValidationErrorMessages,
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
  WARN_LENGTH_THRESHOLD: 4500,
  FILENAME_MAX_LENGTH: 200,
  FILE_MAX_SIZE_MB: 10,
};

/**
 * Palabras prohibidas (sincronizar con backend)
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
  (word) => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
);

/**
 * Hook para validación de mensajes en React Native
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

  const validateMessage = useCallback(
    async (content: string): Promise<ValidationState> => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Validación básica inmediata
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
            const advancedValidation = await performAdvancedValidation(content);
            setValidationState(advancedValidation);
            onValidationChange?.(advancedValidation);
            resolve(advancedValidation);
          } catch (error) {
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

  const clearValidation = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setValidationState({
      isValidating: false,
      isValid: true,
      suggestions: [],
    });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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
 * Validación básica síncrona
 */
function performBasicValidation(
  content: string,
  maxLength: number
): ValidationState {
  const trimmed = content.trim();

  if (!trimmed) {
    return {
      isValidating: false,
      isValid: true,
      suggestions: [],
    };
  }

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

  const warnings = [];
  if (trimmed.length > VALIDATION_LIMITS.WARN_LENGTH_THRESHOLD) {
    warnings.push({
      type: "length" as const,
      message: `Te quedan ${maxLength - trimmed.length} caracteres`,
      severity: "warning" as const,
    });
  }

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
  const trimmed = content.trim()
  if (!trimmed) return false
  for (const pattern of FORBIDDEN_WORDS_REGEX) {
    pattern.lastIndex = 0
    if (pattern.test(trimmed)) return true
  }
  return false
}

/**
 * Validación avanzada asíncrona
 */
async function performAdvancedValidation(
  content: string
): Promise<ValidationState> {
  return {
    isValidating: false,
    isValid: true,
    suggestions: [],
  };
}

/**
 * Hook para validar archivos en React Native
 */
export function useFileValidation(
  options: { maxSizeMb?: number } = {}
): {
  validateFile: (
    file: { uri: string; name: string; size: number; type: string }
  ) => Promise<{ isValid: boolean; error?: string }>;
} {
  const { maxSizeMb = VALIDATION_LIMITS.FILE_MAX_SIZE_MB } = options;

  const allowedMimeTypes = [
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

  const validateFile = useCallback(
    async (
      file: { uri: string; name: string; size: number; type: string }
    ): Promise<{ isValid: boolean; error?: string }> => {
      if (!allowedMimeTypes.includes(file.type)) {
        return {
          isValid: false,
          error: ValidationErrorMessages[
            ValidationErrorCode.UNSUPPORTED_FILE_TYPE
          ],
        };
      }

      const sizeInMb = file.size / (1024 * 1024);
      if (sizeInMb > maxSizeMb) {
        return {
          isValid: false,
          error: ValidationErrorMessages[ValidationErrorCode.FILE_TOO_LARGE],
        };
      }

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
