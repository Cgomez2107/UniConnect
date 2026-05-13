import { useMemo, useState } from "react";

const BG_COLORS = [
  "bg-primary-600",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export interface AvatarProps {
  src?: string;
  name?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

export function Avatar({ src, name, alt = "Avatar", size = "md", className = "" }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const colorClass = useMemo(() => {
    const displayName = name || "?";
    return BG_COLORS[hashName(displayName) % BG_COLORS.length];
  }, [name]);

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const initials = name ? getInitials(name) : "?";

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setImgFailed(true)}
        className={`rounded-full object-cover flex-shrink-0 ${sizeMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold ${colorClass} ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
