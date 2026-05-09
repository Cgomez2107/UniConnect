import React from 'react';

/**
 * Props para el componente Avatar
 */
export interface AvatarProps {
  /** URL de la imagen del avatar */
  src?: string;
  /** Nombre del usuario (para generar iniciales) */
  name?: string;
  /** Texto alternativo para la imagen */
  alt?: string;
  /** Tamaño del avatar */
  size?: 'sm' | 'md' | 'lg';
  /** Texto de fallback (ej: iniciales) */
  fallback?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente Avatar - Avatar de usuario con soporte para fallback
 * 
 * @example
 * <Avatar
 *   src="https://example.com/avatar.jpg"
 *   alt="Juan Pérez"
 *   fallback="JP"
 *   size="md"
 * />
 * 
 * @example
 * <Avatar fallback="CD" size="lg" />
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  alt = 'Avatar',
  size = 'md',
  fallback,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  const showImage = src && src.length > 0;
  
  // Generate initials from name
  const getInitials = (n: string) => {
    return n
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const displayText = fallback || (name ? getInitials(name) : '?');

  return (
    <div
      className={`
        ${sizeStyles[size]}
        rounded-full flex items-center justify-center flex-shrink-0
        overflow-hidden bg-primary-600 text-white font-semibold
        ${className}
      `}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{displayText}</span>
      )}
    </div>
  );
};
