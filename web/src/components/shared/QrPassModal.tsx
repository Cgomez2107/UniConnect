import { useCallback, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Modal } from "@/components/ui/Modal";

interface QrPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrContent: string;
  eventTitle: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function QrPassModal({ isOpen, onClose, qrContent, eventTitle }: QrPassModalProps) {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);

  const handleDownload = useCallback(() => {
    const canvas = qrContainerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `pase-acceso-${eventTitle.replace(/\s+/g, "-")}.png`;
    a.click();
  }, [eventTitle]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(1)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(1)));
  }, []);

  const resetZoom = useCallback(() => setZoom(MIN_ZOOM), []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pase de Acceso">
      <div className="flex flex-col items-center gap-4 py-2">
        <p className="text-sm text-neutral-600 text-center">
          Pase de acceso para: <span className="font-semibold text-neutral-900">{eventTitle}</span>
        </p>

        {/* Zoom controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 text-sm font-bold hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Alejar"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="text-xs text-neutral-500 font-medium hover:text-neutral-700 transition-colors min-w-[3ch] text-center"
            title="Restablecer zoom"
          >
            {zoom}x
          </button>
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 text-sm font-bold hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Acercar"
          >
            +
          </button>
        </div>

        <div
          ref={qrContainerRef}
          className="bg-white p-4 rounded-xl border border-neutral-200 overflow-auto"
          style={{ maxWidth: "100%" }}
        >
          <div
            className="w-fit transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            <QRCodeCanvas value={qrContent} size={256} level="M" />
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Descargar PNG
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default QrPassModal;
