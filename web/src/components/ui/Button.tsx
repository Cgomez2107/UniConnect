import React from 'react';

/**
 * Props para el componente Button
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Si el botón está deshabilitado */
  disabled?: boolean;
  /** Contenido del botón */
  children: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Estado de carga */
  loading?: boolean;
}

/**
 * Componente Button - Botón reutilizable con múltiples variantes
 * 
 * @example
 * <Button variant="primary" onClick={() => console.log('Aceptar')}>
 *   Aceptar
 * </Button>
 * 
 * @example
 * <Button variant="danger" size="sm" disabled>
 *   Eliminar
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const baseStyles = 'font-semibold transition-colors duration-200 flex items-center justify-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    primary: disabled
      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
      : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: disabled
      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
      : 'bg-neutral-200 text-primary-600 hover:bg-neutral-300 focus:ring-neutral-400',
    danger: disabled
      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
      : 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {loading && <span className="animate-spin">⟳</span>}
      {children}
    </button>
  );
};
