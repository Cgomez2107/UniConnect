import React from "react";
import type { StudyResourceUI } from "@/types/ui";
import { Badge } from "@/components/ui/Badge";

interface ResourceCardProps {
  resource: StudyResourceUI;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  isOwner?: boolean;
}

function getFileIcon(fileType: string | null): string {
  if (!fileType) return "📎";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("video")) return "🎬";
  if (fileType.includes("audio")) return "🎵";
  if (fileType.includes("link") || fileType === "url") return "🔗";
  return "📎";
}

function getResourceTypeLabel(resource: StudyResourceUI): string {
  if (resource.fileType === "link" || resource.fileType === "url") return "Enlace";
  if (resource.fileType) return resource.fileType.toUpperCase();
  return "Archivo";
}

export function ResourceCard({
  resource,
  onViewDetails,
  onDelete,
  onEdit,
  isOwner = false,
}: ResourceCardProps) {
  const hasOgImage = resource.ogImage;
  const hasTags = resource.tags && resource.tags.length > 0;

  return (
    <div className="card-hover p-0 overflow-hidden">
      {/* OG Image preview */}
      {hasOgImage && (
        <div className="w-full h-36 bg-neutral-100 overflow-hidden">
          <img
            src={resource.ogImage!}
            alt={resource.ogTitle || resource.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Header: icon + title */}
        <div className="flex items-start gap-3 mb-2">
          {!hasOgImage && (
            <span className="text-2xl flex-shrink-0">{getFileIcon(resource.fileType)}</span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 text-sm truncate">
              {resource.ogTitle || resource.title}
            </h3>
            <p className="text-xs text-neutral-500 truncate">
              {resource.subject?.name || resource.subjectName}
            </p>
          </div>
        </div>

        {/* Description */}
        {(resource.description || resource.ogDescription) && (
          <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
            {resource.ogDescription || resource.description}
          </p>
        )}

        {/* Badges / Decorator icons */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge color="gray" variant="outline">
            {getResourceTypeLabel(resource)}
          </Badge>
          {hasTags && (
            <span
              className="inline-flex items-center gap-0.5 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full"
              title={`${resource.tags!.length} etiqueta${resource.tags!.length !== 1 ? "s" : ""}`}
            >
              🏷️ {resource.tags!.length}
            </span>
          )}
          {resource.ogImage && (
            <span
              className="inline-flex items-center gap-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full"
              title="Vista previa disponible"
            >
              🖼️
            </span>
          )}
        </div>

        {/* Uploader */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-neutral-500 truncate">
            👤 {resource.uploadedBy || resource.uploaderName || "Anónimo"}
          </span>
        </div>

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
              className="px-3 py-2 text-primary-600 border-2 border-primary-600 rounded-md text-sm font-medium hover:bg-primary-600 hover:text-white transition-colors"
            >
              Editar
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
    </div>
  );
}

export default ResourceCard;
