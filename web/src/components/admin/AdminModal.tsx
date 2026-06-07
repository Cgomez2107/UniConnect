import type { ReactNode } from "react";

interface AdminModalProps {
  visible: boolean;
  title: string;
  error: string;
  submitting: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}

export default function AdminModal({ visible, title, error, submitting, onClose, onSave, children }: AdminModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {children}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
