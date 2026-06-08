/**
 * web/src/components/chat/CommunityGuidelinesDialog.tsx
 *
 * Dialog que explica las normas de la comunidad infringidas.
 * Se abre al presionar el botón "¿Por qué?" en el banner de suspensión.
 */

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  errorCode: string | null;
}

interface GuidelineDetails {
  title: string;
  guideline: string;
  tip: string;
  icon: string;
}

function getGuidelineDetails(code: string | null): GuidelineDetails {
  const c = (code ?? "").toUpperCase();

  if (c.includes("MO_001") || c.includes("MESSAGE_TOO_LONG") || c.includes("LIMIT")) {
    return {
      icon: "📝",
      title: "Límite de Longitud",
      guideline:
        "Los mensajes demasiado largos dificultan la lectura e interacción. Mantén tus mensajes bajo el límite de 1000 caracteres.",
      tip: "Intenta resumir tus ideas o enviar la información en múltiples partes más cortas.",
    };
  }

  if (c.includes("MO_002") || c.includes("FORBIDDEN_WORDS") || c.includes("BANNED_CONTENT")) {
    return {
      icon: "🤝",
      title: "Lenguaje y Respeto",
      guideline:
        "No se permiten palabras ofensivas, de odio o contenido inapropiado en UniConnect. Fomentamos un ambiente de estudio y colaboración seguro.",
      tip: "Por favor, exprésate de manera constructiva y respetuosa con los demás estudiantes.",
    };
  }

  if (c.includes("MO_004") || c.includes("ESCALATED") || c.includes("REVISION") || c.includes("HUMANA")) {
    return {
      icon: "🚨",
      title: "Revisión Humana",
      guideline:
        "Tras repetidas infracciones a nuestras normas de convivencia, tu cuenta ha sido temporalmente restringida y tu caso ha sido escalado a revisión por un administrador.",
      tip: "Un administrador del sistema revisará el historial para determinar el estado de tu cuenta de forma manual.",
    };
  }

  // Default: SPAM / MO_003
  return {
    icon: "⏳",
    title: "Prevención de Spam",
    guideline:
      "El envío rápido y masivo de mensajes interrumpe la fluidez y satura el canal de chat. Por favor, modera la frecuencia de tus envíos.",
    tip: "El sistema limita los mensajes a un máximo de 5 mensajes en un lapso de 30 segundos.",
  };
}

export function CommunityGuidelinesDialog({ open, onClose, errorCode }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const details = getGuidelineDetails(errorCode);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="rounded-2xl p-0 shadow-2xl w-full max-w-md bg-white dark:bg-neutral-900 backdrop:bg-black/50 border-0 outline-none"
      style={{ border: "none" }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">{details.icon}</div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Normas de la Comunidad
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Regla afectada:{" "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {details.title}
            </span>
          </p>
        </div>

        {/* Guideline box */}
        <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {details.guideline}
          </p>
        </div>

        {/* Tip box */}
        <div className="bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-primary-700 dark:text-primary-300 mb-1">
            💡 Sugerencia
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {details.tip}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-colors bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          Entendido
        </button>
      </div>
    </dialog>
  );
}
