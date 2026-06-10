import { useEffect } from "react";
import useAdmin from "@/hooks/useAdmin";

const METRIC_CARDS = [
  {
    key: "totalUsers" as const,
    label: "Usuarios Totales",
    color: "bg-primary-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
      </svg>
    ),
  },
  {
    key: "activeStudents" as const,
    label: "Estudiantes Activos",
    color: "bg-success-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l-9 5 9 5 9-5-9-5zm0 0l-9-5v7m18-7v7" />
      </svg>
    ),
  },
  {
    key: "openRequests" as const,
    label: "Solicitudes Abiertas",
    color: "bg-amber-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "totalResources" as const,
    label: "Recursos Totales",
    color: "bg-purple-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "totalMessages" as const,
    label: "Mensajes Enviados",
    color: "bg-info-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
];

export function MetricasPage() {
  const { metrics, loading, error, getMetrics } = useAdmin();

  useEffect(() => {
    getMetrics();
  }, [getMetrics]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary-600 mb-6">
        Métricas Globales
      </h2>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando métricas...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && !metrics && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay métricas disponibles</p>
        </div>
      )}

      {!loading && !error && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {METRIC_CARDS.map((card) => {
            const value = metrics[card.key];
            return (
              <div
                key={card.key}
                className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`${card.color} text-white p-3 rounded-lg`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-neutral-800 mt-1">
                      {value.toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
