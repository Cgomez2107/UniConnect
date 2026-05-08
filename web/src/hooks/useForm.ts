import { useState, useCallback } from "react";

interface UseFormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

/**
 * Hook genérico para gestión de formularios
 *
 * @template T - Tipo de los valores del formulario
 *
 * @param {T} initialValues - Valores iniciales del formulario
 * @param {Function} onSubmit - Función a ejecutar al enviar (async)
 * @param {Function} onValidate - Función de validación opcional
 *
 * @returns {Object} Estado y métodos del formulario
 * @returns {T} values - Valores actuales del formulario
 * @returns {Record<string, string>} errors - Errores de validación
 * @returns {Record<string, boolean>} touched - Campos tocados
 * @returns {boolean} isSubmitting - Estado de envío
 * @returns {Function} setFieldValue - Actualiza el valor de un campo
 * @returns {Function} setFieldError - Establece error en un campo
 * @returns {Function} setFieldTouched - Marca un campo como tocado
 * @returns {Function} handleSubmit - Maneja el envío del formulario
 * @returns {Function} reset - Reinicia el formulario a valores iniciales
 *
 * @example
 * const { values, errors, setFieldValue, handleSubmit } = useForm(
 *   { email: "", password: "" },
 *   async (values) => { await loginService(values); }
 * );
 */
export default function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
  onValidate?: (values: T) => Record<string, string>
) {
  const [state, setState] = useState<UseFormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
  });

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: value,
      },
    }));
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
  }, []);

  const setFieldTouched = useCallback((field: string) => {
    setState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: true,
      },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Validar
      if (onValidate) {
        const validationErrors = onValidate(state.values);
        if (Object.keys(validationErrors).length > 0) {
          setState((prev) => ({
            ...prev,
            errors: validationErrors,
          }));
          return;
        }
      }

      setState((prev) => ({ ...prev, isSubmitting: true, errors: {} }));
      try {
        await onSubmit(state.values);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error en el formulario";
        console.error("Form submission error:", err);
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          errors: { submit: errorMessage },
        }));
      }
      setState((prev) => ({ ...prev, isSubmitting: false }));
    },
    [state.values, onSubmit, onValidate]
  );

  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
    });
  }, [initialValues]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    handleSubmit,
    reset,
  };
}
