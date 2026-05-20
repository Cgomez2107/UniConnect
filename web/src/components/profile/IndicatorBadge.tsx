interface IndicatorBadgeProps {
  icon: string;
  label: string;
  value: number;
}

export default function IndicatorBadge({ icon, label, value }: IndicatorBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 min-w-[80px]">
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-bold text-neutral-900 dark:text-white">
        {value}
      </span>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        {label}
      </span>
    </div>
  );
}
