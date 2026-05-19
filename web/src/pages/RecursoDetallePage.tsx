import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import resourcesService from "@/lib/services/resources.service";

function formatFileSize(kb: number | null | undefined): string {
  if (kb == null) return "";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Fecha no disponible";
  try {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Fecha no disponible";
  }
}

function getFileIcon(fileType: string | null): string {
  if (!fileType) return "📎";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("video")) return "🎬";
  if (fileType.includes("audio")) return "🎵";
  if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  return "📎";
}

export function RecursoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await resourcesService.getResourceById(id);
        if (!cancelled) setResource(data);
      } catch (err: any) {
        if (!cancelled) {
          if (err?.response?.status === 404) {
            setResource(null);
          } else {
            setFetchError("Error al cargar el recurso.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const subjectName = resource?.subjects?.name;
  const uploaderName = resource?.profiles?.fullName;
  const fileType = resource?.fileType || resource?.file_type;
  const fileUrl = resource?.fileUrl || resource?.file_url;
  const fileName = resource?.fileName || resource?.file_name;
  const fileSizeKb = resource?.fileSizeKb ?? resource?.file_size_kb;
  const createdAt = resource?.createdAt || resource?.created_at;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="h-8 w-48 skeleton rounded" />
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-32 skeleton rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-neutral-50 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700">
            {fetchError}
          </div>
          <Button className="mt-4" variant="secondary" onClick={() => navigate("/recursos")}>
            Volver a recursos
          </Button>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-neutral-50 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-warning-700">
            Recurso no encontrado.
          </div>
          <Button className="mt-4" variant="secondary" onClick={() => navigate("/recursos")}>
            Volver a recursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/recursos")}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
        >
          ← Volver a recursos
        </button>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{getFileIcon(fileType)}</span>
                  <h1 className="text-xl font-bold text-neutral-900 truncate">
                    {resource.title}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="blue" variant="outline">
                    {fileType || "Desconocido"}
                  </Badge>
                  {subjectName && (
                    <Badge color="green" variant="solid">
                      {subjectName}
                    </Badge>
                  )}
                  {fileSizeKb != null && (
                    <span className="text-xs text-neutral-400">
                      {formatFileSize(fileSizeKb)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {resource.description && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-neutral-700 mb-2">Descripción</h2>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {resource.description}
                </p>
              </div>
            )}

            <div className="border-t border-neutral-100 pt-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">Archivo</span>
                  <p className="text-neutral-700 font-medium truncate">{fileName || "Sin nombre"}</p>
                </div>
                <div>
                  <span className="text-neutral-400">Subido por</span>
                  <p className="text-neutral-700 font-medium">{uploaderName || "Anónimo"}</p>
                </div>
                <div>
                  <span className="text-neutral-400">Fecha</span>
                  <p className="text-neutral-700 font-medium">{formatDate(createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
                }}
                disabled={!fileUrl}
              >
                {fileUrl ? "Ver archivo" : "Archivo no disponible"}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/recursos")}>
                Volver
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecursoDetallePage;
