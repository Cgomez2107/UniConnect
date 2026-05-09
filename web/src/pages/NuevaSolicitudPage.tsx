import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import useForm from "@/hooks/useForm";

interface NuevaSolicitudFormData {
  subjectId: string;
  description: string;
  maxMembers: number;
}

/**
 * NuevaSolicitudPage - Create a new study group request
 */
export function NuevaSolicitudPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { values, handleChange, handleSubmit } = useForm<NuevaSolicitudFormData>(
    {
      subjectId: "",
      description: "",
      maxMembers: 5,
    },
    async (values) => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Implement actual API call
        navigate("/invitaciones");
      } catch (err) {
        setError("Error al crear la solicitud");
      } finally {
        setLoading(false);
      }
    }
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/invitaciones")}
          className="text-primary-600 hover:underline mb-4"
        >
          ← Volver
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-6">
            Crear nueva solicitud
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Materia
              </label>
              <select
                name="subjectId"
                value={values.subjectId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
                required
              >
                <option value="">Selecciona una materia</option>
                {/* TODO: Load from API */}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={values.description}
                onChange={handleChange}
                placeholder="Describe el propósito del grupo..."
                rows={5}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            {/* Max Members */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Máximo de miembros
              </label>
              <input
                type="number"
                name="maxMembers"
                value={values.maxMembers}
                onChange={handleChange}
                min="2"
                max="20"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/invitaciones")}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Crear solicitud
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaSolicitudPage;
