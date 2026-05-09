import React from 'react';

/**
 * Props para el componente Input
 */
export interface InputProps {
  /** Tipo de input HTML */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'search';
  /** Placeholder del input */
  placeholder?: string;
  /** Valor actual del input */
  value?: string;
  /** Función al cambiar el valor */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Mensaje de error a mostrar */
  error?: string;
  /** Etiqueta del campo */
  label?: string;
  /** Si el input está deshabilitado */
  disabled?: boolean;
  /** Si el campo es requerido */
  required?: boolean;
  /** Nombre del input */
  name?: string;
  /** ID del input */
  id?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Evento al perder el enfoque */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * Componente Input - Campo de entrada con soporte para errores
 * 
 * @example
 * <Input
 *   type="email"
 *   placeholder="tu@email.com"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   label="Correo electrónico"
 *   error={emailError}
 * />
 */
export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  label,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  onBlur,
}) => {
  const inputId = id || name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-lg transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-neutral-100 disabled:cursor-not-allowed
          ${error ? 'border-error-500 focus:ring-error-500' : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'}
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-error-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
