import { useState } from "react";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, body: string) => Promise<void>;
  subjectName: string;
}

export function AskQuestionModal({ isOpen, onClose, onSubmit, subjectName }: AskQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), body.trim());
      setTitle("");
      setBody("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al publicar la pregunta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-neutral-900 mb-1">
          Nueva pregunta
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          en {subjectName}
        </p>

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-error-700 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Ej: ¿Cómo se resuelve el ejercicio 3?"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-xs text-neutral-400 mt-1 block text-right">
              {title.length}/200
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cuerpo
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Describe tu pregunta con detalle..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <span className="text-xs text-neutral-400 mt-1 block text-right">
              {body.length}/5000
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !body.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Publicando..." : "Publicar pregunta"}
          </button>
        </div>
      </div>
    </div>
  );
}
