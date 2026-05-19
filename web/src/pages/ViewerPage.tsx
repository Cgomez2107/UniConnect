import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

function guessIsImage(fileType: string, url: string): boolean {
  const ext = (fileType || url.split("?")[0].split(".").pop() || "").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext);
}

function getExtension(url: string, fileType: string): string {
  return (fileType || url.split("?")[0].split(".").pop() || "archivo").toLowerCase();
}

export function ViewerPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const fileUrl = params.get("url") ? decodeURIComponent(params.get("url")!) : "";
  const title = params.get("title") ? decodeURIComponent(params.get("title")!) : "Archivo";
  const fileName = params.get("fileName") ? decodeURIComponent(params.get("fileName")!) : "archivo";
  const fileType = params.get("fileType") ? decodeURIComponent(params.get("fileType")!) : "";

  const isImage = guessIsImage(fileType, fileUrl);
  const extension = getExtension(fileUrl, fileType);

  if (!fileUrl) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-lg text-neutral-600">No hay archivo para visualizar.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors text-sm font-bold text-neutral-700"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-4">
          <h1 className="text-xl font-extrabold text-neutral-900 mb-3 truncate">
            {title}
          </h1>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-full text-xs font-bold text-neutral-600">
              {extension.toUpperCase()}
            </span>
            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-full text-xs font-bold text-neutral-600">
              {isImage ? "Imagen" : "Documento"}
            </span>
          </div>
        </div>

        {/* Viewer */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {isImage ? (
            <div className="w-full h-[460px] bg-[#0b1320] flex items-center justify-center">
              <img
                src={fileUrl}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-[560px]">
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title={title}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <a
            href={fileUrl}
            download={fileName}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold text-sm"
          >
            <Download size={18} />
            Descargar o compartir
          </a>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-300 bg-white text-neutral-800 rounded-xl hover:bg-neutral-50 transition-colors font-bold text-sm"
          >
            <ExternalLink size={18} />
            Abrir en navegador
          </a>
        </div>
      </div>
    </div>
  );
}

export default ViewerPage;
