import { useState } from "react";
import { ThumbsUp } from "lucide-react";

interface VoteButtonsProps {
  voteCount: number;
  userVote?: "upvote" | null;
  onVote: () => Promise<void>;
  disabled?: boolean;
}

export function VoteButtons({ voteCount, userVote, onVote, disabled }: VoteButtonsProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = async () => {
    if (disabled) return;
    setAnimating(true);
    try {
      await onVote();
    } finally {
      setAnimating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 min-w-[48px]">
      <button
        onClick={handleClick}
        disabled={disabled || animating}
        className={`p-1.5 rounded-full transition-all ${
          userVote === "upvote"
            ? "bg-primary-100 text-primary-600"
            : "text-neutral-400 hover:text-primary-500 hover:bg-neutral-100"
        } ${animating ? "scale-125" : ""}`}
        aria-label="Votar"
      >
        <ThumbsUp size={20} fill={userVote === "upvote" ? "currentColor" : "none"} />
      </button>
      <span
        className={`text-sm font-semibold tabular-nums ${
          voteCount > 0 ? "text-neutral-900" : "text-neutral-400"
        }`}
      >
        {voteCount}
      </span>
    </div>
  );
}
