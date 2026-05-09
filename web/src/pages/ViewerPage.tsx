import React from "react";
import { useParams } from "react-router-dom";

/**
 * ViewerPage - Document viewer for resources/attachments
 */
export function ViewerPage() {
  const { type, id } = useParams<{ type: string; id: string }>();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">Visor</h1>

        {/* Document Viewer */}
        <div className="bg-white rounded-lg shadow-md aspect-video flex items-center justify-center">
          <p className="text-neutral-600">
            Cargando documento de tipo: {type}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-6 flex gap-3 justify-center">
          <button className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300">
            ← Anterior
          </button>
          <button className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300">
            Siguiente →
          </button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
            ⬇️ Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewerPage;
