import React from "react";
import StatBox from "./StatBox";
import type { IndicadoresEstadisticas } from "@/types";

interface StatsRowProps {
  publications: number;
  groups: number;
  subjects: number;
  /** D02: si el backend envió indicadores decorados, se usan en lugar de los valores locales */
  indicadores?: IndicadoresEstadisticas;
}

export default function StatsRow({ publications, groups, subjects, indicadores }: StatsRowProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-center divide-x divide-neutral-200 dark:divide-neutral-600">
        {indicadores ? (
          <>
            <StatBox value={indicadores.mensajesEnviados} label="💬 Mensajes" />
            <StatBox value={indicadores.gruposParticipa} label="👥 Participa" />
            <StatBox value={indicadores.gruposBajoAdministracion} label="📊 Grupos creados" />
            <StatBox value={subjects} label="📚 Materias" />
          </>
        ) : (
          <>
            <StatBox value={publications} label="📝 Publicaciones" />
            <StatBox value={groups} label="👥 Grupos" />
            <StatBox value={0} label="📊 Admin" />
            <StatBox value={subjects} label="📚 Materias" />
          </>
        )}
      </div>
    </div>
  );
}
