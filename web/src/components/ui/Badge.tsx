import React from 'react';

/**
 * Props para el componente Badge
 */
export interface BadgeProps {
  /** Contenido del badge */
  children: React.ReactNode;
  /** Color del badge */
  color?: 'blue' | 'gold' | 'green' | 'red' | 'gray';
  /** Variante de estilo */
  variant?: 'solid' | 'outline';
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente Badge - Pequeña etiqueta para estados/labels
 * 
 * @example
 * <Badge color="green" variant="solid">Activo</Badge>
 * 
 * @example
 * <Badge color="gold" variant="outline">Premium</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'blue',
  variant = 'solid',
  className = '',
}) => {
  const colorMap = {
    blue: {
      solid: 'bg-primary-600 text-white',
      outline: 'border-2 border-primary-600 text-primary-600 bg-transparent',
    },
    gold: {
      solid: 'bg-secondary-500 text-white',
      outline: 'border-2 border-secondary-500 text-secondary-500 bg-transparent',
    },
    green: {
      solid: 'bg-success-500 text-white',
      outline: 'border-2 border-success-500 text-success-500 bg-transparent',
    },
    red: {
      solid: 'bg-error-500 text-white',
      outline: 'border-2 border-error-500 text-error-500 bg-transparent',
    },
    gray: {
      solid: 'bg-neutral-500 text-white',
      outline: 'border-2 border-neutral-500 text-neutral-500 bg-transparent',
    },
  };

  return (
    <span
      className={`
        inline-block rounded-full px-3 py-1 text-xs font-semibold
        transition-colors duration-200
        ${colorMap[color][variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
