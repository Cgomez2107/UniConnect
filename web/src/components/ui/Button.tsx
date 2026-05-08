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
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-uc-blue text-white hover:bg-uc-blue-dark focus:ring-uc-blue',
    secondary: disabled
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-gray-200 text-uc-blue hover:bg-gray-300 focus:ring-gray-400',
    danger: disabled
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
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
