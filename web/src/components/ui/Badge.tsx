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
      solid: 'bg-uc-blue text-white',
      outline: 'border-2 border-uc-blue text-uc-blue bg-transparent',
    },
    gold: {
      solid: 'bg-uc-gold text-uc-blue',
      outline: 'border-2 border-uc-gold text-uc-gold bg-transparent',
    },
    green: {
      solid: 'bg-green-500 text-white',
      outline: 'border-2 border-green-500 text-green-500 bg-transparent',
    },
    red: {
      solid: 'bg-red-500 text-white',
      outline: 'border-2 border-red-500 text-red-500 bg-transparent',
    },
    gray: {
      solid: 'bg-gray-300 text-gray-700',
      outline: 'border-2 border-gray-300 text-gray-700 bg-transparent',
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
