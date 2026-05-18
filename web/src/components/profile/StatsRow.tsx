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
        <StatBox value={indicadores?.mensajesEnviados ?? publications} label={indicadores ? "Mensajes" : "Publicaciones"} />
        <StatBox value={indicadores?.gruposParticipa ?? groups} label={indicadores ? "Grupos" : "Grupos"} />
        <StatBox value={indicadores?.gruposBajoAdministracion ?? 0} label={indicadores ? "Admin" : "Admin"} />
        <StatBox value={subjects} label="Materias" />
      </div>
    </div>
  );
}
