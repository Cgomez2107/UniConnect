import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import profilesService from "@/lib/services/profiles.service";
import resourcesService from "@/lib/services/resources.service";
import { uploadResourceFile } from "@/lib/supabase";
import { deps } from "@/store/deps";
import { Button } from "@/components/ui/Button";
import type { UserProgram } from "@/types";

const MAX_SIZE = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadMode = "file" | "link";

export function SubirRecursoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [programId, setProgramId] = useState<string | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [uploadMode, setUploadMode] = useState<UploadMode>("file");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  // Link mode fields
  const [externalUrl, setExternalUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingSubjects(true);
        const [subjectsData, programsData] = await Promise.all([
          profilesService.getMySubjects(),
          profilesService.getMyPrograms(),
        ]);
        if (cancelled) return;
        setSubjects(subjectsData);
        const primary = programsData[0];
        if (primary) setProgramId(primary.programId ?? primary.program_id);
      } catch (err: any) {
        if (!cancelled) setFetchError(err?.response?.data?.message || "Error al cargar datos.");
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setUploadError("El archivo excede el límite de 10 MB.");
      return;
    }

    setPickedFile(file);
    setUploadError(null);
  };

  const handleRemoveFile = () => {
    setPickedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!user?.id || !title.trim() || !selectedSubjectId || !programId) {
      setUploadError("Completa todos los campos requeridos antes de subir.");
      return;
    }

    if (uploadMode === "file" && !pickedFile) {
      setUploadError("Selecciona un archivo para subir.");
      return;
    }

    if (uploadMode === "link" && !externalUrl.trim()) {
      setUploadError("Ingresa la URL del recurso.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      let fileUrl: string;
      let fileName: string;
      let fileType: string | undefined;
      let fileSizeKb: number | undefined;

      if (uploadMode === "file" && pickedFile) {
        fileUrl = await uploadResourceFile(user.id, pickedFile);
        if (!fileUrl) throw new Error("Error al subir el archivo al almacenamiento.");
        fileName = pickedFile.name;
        fileType = pickedFile.name.split(".").pop()?.toLowerCase() || undefined;
        fileSizeKb = Math.round(pickedFile.size / 1024);
      } else {
        fileUrl = externalUrl.trim();
        fileName = externalUrl.trim();
        fileType = "link";
      }

      await resourcesService.uploadResource({
        subjectId: selectedSubjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl,
        fileName,
        fileType,
        fileSizeKb,
        programId,
      });

      navigate("/recursos");
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || err.message || "Error al subir el recurso.");
    } finally {
      setUploading(false);
    }
  };

  const isValid =
    title.trim().length >= 3 &&
    !!selectedSubjectId &&
    !!programId &&
    !!user?.id &&
    (uploadMode === "file" ? !!pickedFile : externalUrl.trim().length > 0);

  if (loadingSubjects) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">{fetchError}</p>
          <Button variant="secondary" onClick={() => navigate("/recursos")}>
            Volver a recursos
          </Button>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">📚</p>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Sin materias inscritas</h2>
          <p className="text-neutral-500 text-sm mb-6">
            {user?.role === "admin"
              ? "No hay materias activas en el catálogo para subir un recurso."
              : "Necesitas tener materias inscritas para subir un recurso."}
          </p>
          <Button variant="secondary" onClick={() => navigate("/recursos")}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button
          onClick={() => navigate("/recursos")}
          className="text-primary-700 hover:text-primary-800 text-sm font-medium mb-6 transition-colors"
        >
          ← Volver a recursos
        </button>

        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-6 sm:mb-8">
          Subir recurso
        </h1>

        {/* Mode toggle */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <button
            onClick={() => setUploadMode("file")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              uploadMode === "file"
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
            }`}
          >
            📁 Subir archivo
          </button>
          <button
            onClick={() => setUploadMode("link")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              uploadMode === "link"
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
            }`}
          >
            🔗 Compartir enlace
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Resumen Capítulo 3 - Cálculo II"
              maxLength={100}
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-400 mt-1">
              {title.trim().length}/100 · mínimo 3 caracteres
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={uploadMode === "link" ? "Describe el contenido del enlace…" : "Describe brevemente el contenido del recurso…"}
              maxLength={300}
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-neutral-400 mt-1">
              {description.trim().length}/300
            </p>
          </div>

          {/* Subject selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Materia * ({subjects.length} disponibles)
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s: any) => {
                const active = selectedSubjectId === s.subjectId;
                return (
                  <button
                    key={s.subjectId}
                    onClick={() => setSelectedSubjectId(active ? null : s.subjectId)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                    }`}
                  >
                    {active && <span className="text-xs">✓</span>}
                    {s.subjects?.name || s.subject?.name || "Materia"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File / Link picker */}
          {uploadMode === "file" ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Archivo *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {pickedFile ? (
                <div className="flex items-center gap-3 p-3 bg-white border border-neutral-300 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      📎 {pickedFile.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatSize(pickedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-error-600 hover:text-error-700 font-bold text-lg px-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePickFile}
                  className="w-full p-6 border-2 border-dashed border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors text-center"
                >
                  <p className="text-2xl mb-1">📁</p>
                  <p className="text-sm font-semibold text-primary-600">
                    Seleccionar archivo
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Cualquier formato · máx 10 MB
                  </p>
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                URL del recurso *
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://ejemplo.com/recurso"
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-700 whitespace-pre-wrap">⚠️ {uploadError}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            variant="primary"
            className="w-full"
            onClick={handleUpload}
            disabled={!isValid || uploading}
            loading={uploading}
          >
            {uploading ? "Subiendo..." : "Subir recurso"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SubirRecursoPage;
