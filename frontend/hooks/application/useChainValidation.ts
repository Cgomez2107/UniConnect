import { useCallback, useRef, useState } from "react";
import { ValidationChainFactory } from "@/lib/patterns/chain";
import type { ValidationResult, ValidationMetadata } from "@/lib/patterns/chain";

interface UseChainValidationOptions {
  maxLength?: number;
  forbiddenWords?: string[];
  maxMentions?: number;
  debounceMs?: number;
}

const DEFAULT_OPTIONS: UseChainValidationOptions = {
  maxLength: 5000,
  maxMentions: 10,
  debounceMs: 300,
};

export function useChainValidation(options: UseChainValidationOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chainRef = useRef(ValidationChainFactory.createChain(opts.maxLength, opts.forbiddenWords, opts.maxMentions));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastResult, setLastResult] = useState<ValidationResult>({ isValid: true });

  const validateSync = useCallback(
    (content: string, metadata?: ValidationMetadata): Promise<ValidationResult> => {
      return chainRef.current.handle(content, metadata);
    },
    [],
  );

  const validateDebounced = useCallback(
    (content: string, metadata?: ValidationMetadata): Promise<ValidationResult> => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      return new Promise((resolve) => {
        debounceRef.current = setTimeout(async () => {
          const result = await chainRef.current.handle(content, metadata);
          setLastResult(result);
          resolve(result);
        }, opts.debounceMs);
      });
    },
    [opts.debounceMs],
  );

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLastResult({ isValid: true });
  }, []);

  return {
    lastResult,
    validateSync,
    validateDebounced,
    clear,
  };
}
