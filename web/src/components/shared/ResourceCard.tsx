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
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{getFileIcon(resource.fileType || "")}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900">{resource.title}</h3>
            <p className="text-sm text-neutral-600">{resource.subject?.name || resource.subjectName}</p>
          </div>
        </div>

      <p className="text-sm text-neutral-700 mb-3 line-clamp-2">
        {resource.description}
      </p>

      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-neutral-500">👤 {resource.uploadedBy || resource.uploaderName || "Anónimo"}</span>
        <Badge>{resource.fileType}</Badge>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(resource.id)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 transition-colors"
        >
          Ver recurso
        </button>
        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(resource.id)}
            className="px-3 py-2 text-error-600 border-2 border-error-600 rounded text-sm hover:bg-error-600 hover:text-white transition-colors"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

export default ResourceCard;
