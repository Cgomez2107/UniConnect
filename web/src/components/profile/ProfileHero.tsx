import React, { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

interface ProfileHeroProps {
  name: string;
  email: string;
  avatarUrl?: string;
  primaryProgram?: string;
}

export default function ProfileHero({ name, email, avatarUrl, primaryProgram }: ProfileHeroProps) {
  const [scale, setScale] = useState(false);

  return (
    <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500" />
      <div className="flex items-start gap-4 mt-2">
        <button
          onClick={() => setScale((p) => !p)}
          className={`transition-transform duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 ${scale ? "scale-110" : "scale-100"}`}
          aria-label="Ampliar avatar"
        >
          <Avatar src={avatarUrl} name={name} size="lg" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white truncate">{name}</h1>
          <p className="text-neutral-600 dark:text-neutral-300 truncate">{email}</p>
          {primaryProgram && (
            <span className="inline-block mt-2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm font-medium">
              {primaryProgram}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
