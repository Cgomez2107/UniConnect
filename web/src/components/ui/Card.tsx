import React from 'react';

/**
 * Props para el componente Card
 */
export interface CardProps {
  /** Contenido de la tarjeta */
  children: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Función a ejecutar al hacer clic (opcional) */
  onClick?: () => void;
  /** Variante de estilo */
  variant?: 'default' | 'hover' | 'elevated';
}

/**
 * Componente Card - Contenedor para agrupar contenido
 * 
 * @example
 * <Card variant="default">
 *   <h3>Título de la tarjeta</h3>
 *   <p>Contenido de la tarjeta</p>
 * </Card>
 * 
 * @example
 * <Card variant="hover" onClick={() => navigate('/details')}>
 *   <div>Contenido interactivo</div>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white shadow rounded-lg p-4',
    hover: 'bg-white shadow hover:shadow-lg hover:scale-105 rounded-lg p-4 transition-all duration-300 cursor-pointer',
    elevated: 'bg-white shadow-lg rounded-lg p-4 border border-neutral-100',
  };

  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant]} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};
