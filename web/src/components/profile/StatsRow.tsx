import React from "react";
import StatBox from "./StatBox";

interface StatsRowProps {
  publications: number;
  groups: number;
  subjects: number;
}

export default function StatsRow({ publications, groups, subjects }: StatsRowProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-center divide-x divide-neutral-200 dark:divide-neutral-600">
        <StatBox value={publications} label="Publicaciones" />
        <StatBox value={groups} label="Grupos" />
        <StatBox value={subjects} label="Materias" />
      </div>
    </div>
  );
}
