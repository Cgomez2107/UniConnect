import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import useForm from "@/hooks/useForm";
import studyGroupsService from "@/lib/services/studyGroups.service";
import profilesService from "@/lib/services/profiles.service";
import { useStudyGroupsStore } from "@/store/useStudyGroupsStore";
import type { Subject } from "@/types";

interface NuevaSolicitudFormData {
  title: string;
  subjectId: string;
  description: string;
  maxMembers: number;
}

export function NuevaSolicitudPage() {
  const navigate = useNavigate();
  const addGroup = useStudyGroupsStore((s) => s.addGroup);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userSubjects = await profilesService.getMySubjects();
        if (!cancelled) {
          setSubjects(
            (userSubjects as any[])
              .filter((us: any) => us.subject?.id && us.subject?.name)
              .map((us: any) => ({ id: us.subject!.id, name: us.subject!.name })) as any
          );
        }
      } catch {
        if (!cancelled) setError("Error al cargar tus materias.");
      } finally {
        if (!cancelled) setSubjectsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { values, handleChange, handleSubmit, isSubmitting } = useForm<NuevaSolicitudFormData>(
    {
      title: "",
      subjectId: "",
      description: "",
      maxMembers: 5,
    },
    async (formValues) => {
      setError(null);
      try {
        const newGroup = await studyGroupsService.createStudyGroup({
          subjectId: formValues.subjectId,
          title: formValues.title.trim(),
          description: formValues.description.trim(),
          maxMembers: formValues.maxMembers,
        });
        // Inject into global store so the feed updates immediately for all users
        if (newGroup) addGroup(newGroup as any);
        navigate("/solicitudes");
      } catch (err: any) {
        if (err?.status === 409) {
          setError(err?.response?.data?.error || "No puedes crear más grupos para esta materia");
          return;
        }
        throw new Error(err?.response?.data?.message || err?.response?.data?.error || "Error al crear el grupo.");
      }
    },
    (formValues) => {
      const errs: Record<string, string> = {};
      if (!formValues.subjectId) errs.subjectId = "Debes seleccionar una materia.";
      if (!formValues.title.trim()) errs.title = "El título es obligatorio.";
      if (!formValues.description.trim()) errs.description = "La descripción es obligatoria.";
      return errs;
    }
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <button
          onClick={() => navigate("/solicitudes")}
          className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium mb-4 transition-colors"
        >
          ← Volver a solicitudes
        </button>

        <div className="card p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-primary-900 dark:text-white mb-6">
            Crear nuevo grupo
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Título del grupo
              </label>
              <input
                type="text"
                name="title"
                value={values.title}
                onChange={handleChange}
                placeholder="Ej: Grupo de estudio de Cálculo I"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Materia
              </label>
              <select
                name="subjectId"
                value={values.subjectId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                required
                disabled={subjectsLoading}
              >
                <option value="">
                  {subjectsLoading ? "Cargando materias..." : "Selecciona una materia"}
                </option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={values.description}
                onChange={handleChange}
                placeholder="Describe el propósito del grupo, los temas a estudiar, horarios planeados..."
                rows={5}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            {/* Max Members */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Máximo de miembros
              </label>
              <input
                type="number"
                name="maxMembers"
                value={values.maxMembers}
                onChange={handleChange}
                min="2"
                max="20"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/solicitudes")}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Crear grupo
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaSolicitudPage;
