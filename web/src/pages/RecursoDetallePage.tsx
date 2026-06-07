import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import resourcesService from "@/lib/services/resources.service";
import { useAuthStore } from "@/store/useAuthStore";

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
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isEditMode = searchParams.get("editar") === "true";

  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await resourcesService.getResourceById(id);
        if (!cancelled) {
          setResource(data);
          setEditTitle(data?.title || "");
          setEditDescription(data?.description || "");
        }
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
  const fileType = resource?.fileType || resource?.file_type || resource?.resourceType;
  const fileUrl = resource?.fileUrl || resource?.file_url || "";
  const fileName = resource?.fileName || resource?.file_name;
  const fileSizeKb = resource?.fileSizeKb ?? resource?.file_size_kb;
  const createdAt = resource?.createdAt || resource?.created_at;

  // OG data for links
  const ogTitle = resource?.ogTitle;
  const ogDescription = resource?.ogDescription;
  const ogImage = resource?.ogImage;
  const isLink = resource?.type === "link" || resource?.resourceType === "link";
  const linkUrl = resource?.url ?? null;

  // The URL to open: for files it's fileUrl, for links it's the link URL
  const resourceActionUrl = isLink ? linkUrl : (fileUrl || null);

  const isOwner = user?.id === resource?.userId || user?.id === resource?.uploaderUserId || user?.role === "admin";

  const handleSave = async () => {
    if (!id || !editTitle.trim()) {
      setSaveError("El título es obligatorio.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await resourcesService.updateResource(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setResource(updated);
      navigate(`/recursos/${id}`, { replace: true });
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/recursos/${id}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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

  if (isEditMode && isOwner) {
    return (
      <div className="min-h-screen bg-neutral-50 animate-fade-in">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
          >
            ← Cancelar
          </button>

          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 mb-6">
                Editar recurso
              </h1>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={200}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
              </div>

              {saveError && (
                <p className="mt-4 text-sm text-error-600">{saveError}</p>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="w-full sm:w-auto"
                >
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
                <Button variant="secondary" onClick={handleCancel} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate("/recursos")}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
        >
          ← Volver a recursos
        </button>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          {/* OG Image Preview for Links */}
          {isLink && ogImage && (
            <div className="w-full">
              <img
                src={ogImage}
                alt={ogTitle || resource.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl flex-shrink-0">{isLink ? "🔗" : getFileIcon(fileType)}</span>
                  <h1 className="text-lg sm:text-xl font-bold text-neutral-900 break-words">
                    {ogTitle || resource.title}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={isLink ? "green" : "blue"} variant="outline">
                    {isLink ? "Enlace" : (fileType || "Desconocido")}
                  </Badge>
                  {subjectName && (
                    <Badge color="green" variant="solid">
                      {subjectName}
                    </Badge>
                  )}
                  {fileSizeKb != null && !isLink && (
                    <span className="text-xs text-neutral-400">
                      {formatFileSize(fileSizeKb)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {ogDescription && isLink ? (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-neutral-700 mb-2">Descripción</h2>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {ogDescription}
                </p>
              </div>
            ) : resource.description ? (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-neutral-700 mb-2">Descripción</h2>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {resource.description}
                </p>
              </div>
            ) : null}

            <div className="border-t border-neutral-100 pt-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">{isLink ? "Enlace" : "Archivo"}</span>
                  <p className="text-neutral-700 font-medium truncate" title={isLink ? (linkUrl ?? "") : undefined}>
                    {isLink ? (linkUrl || "Sin enlace") : (fileName || "Sin nombre")}
                  </p>
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

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  if (resourceActionUrl) window.open(resourceActionUrl, "_blank", "noopener,noreferrer");
                }}
                disabled={!resourceActionUrl}
                className="w-full sm:w-auto"
              >
                {resourceActionUrl ? (isLink ? "Abrir enlace" : "Ver archivo") : "Archivo no disponible"}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/recursos")} className="w-full sm:w-auto">
                Volver
              </Button>
              {isOwner && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/recursos/${id}?editar=true`)}
                  className="w-full sm:w-auto"
                >
                  ✏️ Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecursoDetallePage;
