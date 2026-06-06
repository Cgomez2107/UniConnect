import React from "react";
import { StudyResourceUI } from "@/types/ui";
import { Badge } from "@/components/ui/Badge";

interface ResourceCardProps {
  resource: StudyResourceUI;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  isOwner?: boolean;
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  document: "Documento",
  presentation: "Presentación",
  spreadsheet: "Hoja de cálculo",
  video: "Video",
  audio: "Audio",
  image: "Imagen",
  link: "Enlace",
  archive: "Archivo comprimido",
  file: "Archivo",
  other: "Otro",
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  pdf: "bg-red-100 text-red-700",
  document: "bg-blue-100 text-blue-700",
  presentation: "bg-orange-100 text-orange-700",
  spreadsheet: "bg-emerald-100 text-emerald-700",
  video: "bg-purple-100 text-purple-700",
  audio: "bg-pink-100 text-pink-700",
  image: "bg-amber-100 text-amber-700",
  link: "bg-green-100 text-green-700",
  archive: "bg-neutral-200 text-neutral-700",
  file: "bg-neutral-100 text-neutral-600",
};

function getTypeLabel(type: string | null): string {
  const key = (type ?? "other").toLowerCase();
  return RESOURCE_TYPE_LABELS[key] ?? type ?? "Otro";
}

function getTypeColor(type: string | null): string {
  const key = (type ?? "other").toLowerCase();
  return RESOURCE_TYPE_COLORS[key] ?? "bg-neutral-100 text-neutral-700";
}

export function ResourceCard({
  resource,
  onViewDetails,
  onDelete,
  onEdit,
  isOwner = false,
}: ResourceCardProps) {
  const typeLabel = getTypeLabel(resource.resourceType ?? resource.fileType);
  const typeColor = getTypeColor(resource.resourceType ?? resource.fileType);

  return (
    <div className="card-hover p-4">
      {/* Open Graph Preview */}
      {resource.resourceType === "link" && resource.ogImage && (
        <div className="mb-3 rounded-lg overflow-hidden bg-neutral-100">
          <img
            src={resource.ogImage}
            alt={resource.ogTitle ?? resource.title}
            className="w-full h-32 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 text-sm truncate">{resource.title}</h3>
          {resource.ogTitle && resource.resourceType === "link" && resource.ogTitle !== resource.title && (
            <p className="text-xs text-neutral-400 truncate">{resource.ogTitle}</p>
          )}
          <p className="text-xs text-neutral-500">{resource.subject?.name || resource.subjectName}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
        {resource.ogDescription ?? resource.description}
      </p>

      {/* Open Graph description fallback */}
      {resource.resourceType === "link" && resource.ogDescription && resource.description && (
        <p className="text-xs text-neutral-400 mb-2 italic">
          {resource.ogDescription}
        </p>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-neutral-500 truncate">
          👤 {resource.uploadedBy || resource.uploaderName || "Anónimo"}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeColor}`}>
          {typeLabel}
        </span>
      </div>

      {/* Active Decorators */}
      {resource.activeDecorators && resource.activeDecorators.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.activeDecorators.includes("openGraph") && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              📄 Open Graph
            </span>
          )}
          {resource.activeDecorators.includes("rating") && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
              ⭐ Valoración
            </span>
          )}
          {resource.activeDecorators.includes("comments") && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              💬 Comentarios
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(resource.id)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Ver recurso
        </button>
        {isOwner && onEdit && (
          <button
            onClick={() => onEdit(resource.id)}
            className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-300 transition-colors"
            title="Editar recurso"
          >
            ✏️
          </button>
        )}
        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(resource.id)}
            className="px-3 py-2 text-error-600 border-2 border-error-600 rounded-md text-sm font-medium hover:bg-error-600 hover:text-white transition-colors"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

export default ResourceCard;
