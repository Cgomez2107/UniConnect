import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Props para el componente Modal
 */
export interface ModalProps {
  /** Si el modal está abierto */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Contenido del modal */
  children: React.ReactNode;
  /** Título del modal */
  title?: string;
  /** Contenido del pie del modal */
  footer?: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Si permite cerrar con ESC */
  closeOnEscape?: boolean;
}

/**
 * Componente Modal - Ventana modal con backdrop
 * 
 * @example
 * <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirmar acción">
 *   <p>¿Estás seguro de continuar?</p>
 *   <div className="flex gap-2 mt-4">
 *     <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
 *     <Button variant="primary" onClick={handleConfirm}>Confirmar</Button>
 *   </div>
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  footer,
  className = '',
  closeOnEscape = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4
          transform transition-all duration-200 z-50
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 px-6 py-4 flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
