import type { Insignia } from "@/types";

interface BadgePanelProps {
  insignias: Insignia[];
}

const BADGE_EMOJI_FALLBACK: Record<string, string> = {
  primer_publicacion: "📝",
  colaborador: "🤝",
  red_social: "🌐",
  estrella: "⭐",
  experto: "🏆",
  veterano: "🎖️",
};

function formatDate(raw: string): string {
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString(); } catch { return ""; }
}

function badgeKey(insignia: Insignia, index: number): string {
  return insignia.id || insignia.nombre || `badge-${index}`;
}

export default function BadgePanel({ insignias }: BadgePanelProps) {
  if (!insignias || insignias.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-4">
        Insignias
      </h2>
      <div className="flex flex-wrap gap-3">
        {insignias.map((insignia, index) => {
          const hasFecha = !!insignia.fechaObtenida;
          const hasIcon = !!insignia.iconoUrl;
          return (
            <div
              key={badgeKey(insignia, index)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
              title={`${insignia.nombre}${hasFecha ? ` — ${formatDate(insignia.fechaObtenida)}` : ""}`}
            >
              {hasIcon ? (
                <img src={insignia.iconoUrl} alt={insignia.nombre} className="w-8 h-8" />
              ) : (
                <span className="text-2xl">{BADGE_EMOJI_FALLBACK[insignia.id] ?? "🏅"}</span>
              )}
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 text-center max-w-[72px] leading-tight">
                {insignia.nombre}
              </span>
              {hasFecha && (
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {formatDate(insignia.fechaObtenida)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
