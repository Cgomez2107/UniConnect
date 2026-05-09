import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/**
 * SolicitudDetailPage - View detailed information about a study group request
 */
export function SolicitudDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchSolicitud = async () => {
      // TODO: Implement actual API call
      setLoading(false);
    };

    fetchSolicitud();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!solicitud) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-600 mb-4">Solicitud no encontrada</p>
        <Button onClick={() => navigate("/invitaciones")}>
          Volver a solicitudes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate("/invitaciones")}
          className="text-primary-600 hover:underline mb-4"
        >
          ← Volver
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {solicitud.subject?.name}
          </h1>
          <p className="text-neutral-600 mb-4">{solicitud.description}</p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-neutral-600">Creador</p>
              <p className="font-semibold text-neutral-900">
                {solicitud.creatorName}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Miembros</p>
              <p className="font-semibold text-neutral-900">
                {solicitud.memberCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Estado</p>
              <p className="font-semibold text-neutral-900">{solicitud.status}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Creado</p>
              <p className="font-semibold text-neutral-900">
                {new Date(solicitud.createdAt).toLocaleDateString("es-CO")}
              </p>
            </div>
          </div>

          {solicitud.status === "OPEN" && (
            <Button
              onClick={() => setShowApplicationModal(true)}
              variant="primary"
            >
              Postularse
            </Button>
          )}
        </div>

        {/* Applications List (if owner) */}
        {user?.id === solicitud.creatorId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Postulaciones ({applications.length})
            </h2>
            {applications.length === 0 ? (
              <p className="text-neutral-600">Sin postulaciones aún</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="border-l-4 border-l-primary-500 p-3">
                    <p className="font-semibold text-neutral-900">
                      {app.applicantName}
                    </p>
                    <p className="text-sm text-neutral-600">{app.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Modal */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        title="Postularse al grupo de estudio"
      >
        <div className="space-y-4">
          <textarea
            placeholder="Cuéntanos por qué quieres unirte a este grupo..."
            className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
            rows={4}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowApplicationModal(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary">Enviar postulación</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SolicitudDetailPage;
