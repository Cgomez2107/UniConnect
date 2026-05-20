import { useState } from "react";

interface AnswerFormProps {
  onSubmit: (body: string) => Promise<void>;
}

export function AnswerForm({ onSubmit }: AnswerFormProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar la respuesta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">
        Tu respuesta
      </h3>

      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-error-700 text-sm mb-3">
          {error}
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={4}
        placeholder="Escribe tu respuesta..."
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-neutral-400">
          {body.length}/5000
        </span>
        <button
          onClick={handleSubmit}
          disabled={submitting || !body.trim()}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Enviando..." : "Responder"}
        </button>
      </div>
    </div>
  );
}
