import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePostulationForm } from "@/hooks/usePostulationForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function PostularPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    request,
    loadingRequest,
    message,
    setMessage,
    sending,
    isClosed,
    isSubmitDisabled,
    handlePostular,
    submitError,
  } = usePostulationForm(id);

  const onSubmit = async () => {
    try {
      await handlePostular();
      setShowSuccessModal(true);
    } catch {
      // error is handled by the hook
    }
  };

  if (loadingRequest) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium mb-4 transition-colors"
        >
          ← Volver
        </button>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Postularme</h1>

          {request && (
            <div className="bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-lg p-4 mb-6">
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Te postulas a
              </p>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{request.title}</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                {request.subjects?.name || request.subject_name || request.subjectName || ""} · por {request.profiles?.full_name || request.author?.fullName || "Usuario"}
              </p>
              {isClosed && (
                <p className="text-error-600 dark:text-error-400 text-sm font-bold mt-2">
                  Convocatoria cerrada
                </p>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Mensaje de presentación
            </label>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              Cuéntale al creador por qué quieres unirte y cómo puedes aportar al grupo.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending || isClosed}
              placeholder="Ej: Hola, estoy cursando la materia y me gustaría estudiar en grupo porque..."
              maxLength={500}
              rows={6}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400 resize-none transition-colors disabled:bg-neutral-100 dark:disabled:bg-neutral-800"
              aria-label="Mensaje de presentación"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-right mt-1">
              {message.length}/500
            </p>
          </div>

          {submitError && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 text-error-700 dark:text-error-300 text-sm mb-4">
              {submitError}
            </div>
          )}

          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            loading={sending}
            className="w-full"
          >
            {sending ? "Enviando..." : "Enviar postulación"}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => navigate("/solicitudes")}
        title="Postulación Enviada"
        footer={
          <Button variant="primary" onClick={() => navigate("/solicitudes")} className="w-full">
            Ir a solicitudes
          </Button>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
            Tu mensaje de presentación ha sido enviado al administrador. Recibirás una notificación si eres aceptado en el grupo.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default PostularPage;
