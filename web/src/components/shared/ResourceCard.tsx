import React from "react";
import { StudyResourceUI } from "@/types/ui";
import { Badge } from "@/components/ui/Badge";

interface ResourceCardProps {
  resource: StudyResourceUI;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

/**
 * ResourceCard component for displaying study resources
 */
export function ResourceCard({
  resource,
  onViewDetails,
  onDelete,
  isOwner = false,
}: ResourceCardProps) {
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("video")) return "🎬";
    return "📎";
  };

  return (
    <div className="card-hover p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0">{getFileIcon(resource.fileType || "")}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 text-sm truncate">{resource.title}</h3>
          <p className="text-xs text-neutral-500">{resource.subject?.name || resource.subjectName}</p>
        </div>
      </div>

      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
        {resource.description}
      </p>

      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-neutral-500 truncate">👤 {resource.uploadedBy || resource.uploaderName || "Anónimo"}</span>
        <Badge>{resource.fileType}</Badge>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(resource.id)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Ver recurso
        </button>
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
