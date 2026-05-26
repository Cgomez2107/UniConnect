import React, { useMemo, useState } from "react";
import type { PollDataUI } from "@/types/ui";

interface PollMessageProps {
  poll: PollDataUI;
  currentUserId?: string;
  onVote: (optionIndex: number) => void;
  voterMap?: Record<string, string>;
}

function getTotalVotes(options: PollDataUI["options"]): number {
  return options.reduce((sum, o) => sum + o.votes.length, 0);
}

function getPercentage(options: PollDataUI["options"], index: number): number {
  const total = getTotalVotes(options);
  if (total === 0) return 0;
  return Math.round((options[index].votes.length / total) * 100);
}

export function PollMessage({
  poll,
  currentUserId,
  onVote,
  voterMap,
}: PollMessageProps) {
  const [expandedOption, setExpandedOption] = useState<number | null>(null);
  const hasVoted = useMemo(
    () => currentUserId && poll.options.some((o) => o.votes.includes(currentUserId)),
    [poll.options, currentUserId],
  );

  const isClosed = !poll.isOpen;
  const showResults = isClosed || hasVoted;

  return (
    <div className="mt-2 border border-neutral-200 rounded-lg p-3 bg-neutral-50">
      <p className="text-sm font-semibold text-neutral-800 mb-2">
        {poll.question}
      </p>
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const pct = getPercentage(poll.options, index);
          const total = getTotalVotes(poll.options);
          const voted = currentUserId && option.votes.includes(currentUserId);
          const canChangeVote = showResults && !isClosed && !voted;

          return (
            <div key={index}>
              {showResults ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (canChangeVote) onVote(index);
                      setExpandedOption(expandedOption === index ? null : index);
                    }}
                    disabled={!poll.isOpen}
                    className="w-full text-left"
                  >
                    <div
                      className={`w-full h-8 rounded-md flex items-center px-3 text-xs font-medium ${
                        voted
                          ? "bg-primary-100 text-primary-800"
                          : canChangeVote
                            ? "bg-neutral-200 text-neutral-700 cursor-pointer hover:bg-neutral-300"
                            : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-between w-full">
                        <span>{option.text}</span>
                        <span>
                          {option.votes.length} voto{option.votes.length !== 1 ? "s" : ""} ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div
                      className="absolute bottom-0 left-0 h-1 rounded-md bg-primary-500/30"
                      style={{ width: `${pct}%` }}
                    />
                  </button>
                  {expandedOption === index && voterMap && option.votes.length > 0 && (
                    <div className="mt-1 pl-2 text-[11px] text-neutral-500 flex flex-wrap gap-x-2">
                      {option.votes.map((uid) => (
                        <span key={uid}>{voterMap[uid] || uid}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onVote(index)}
                  disabled={!poll.isOpen}
                  className="w-full text-left px-3 py-2 rounded-md border border-primary-300 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {option.text}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center mt-2 text-[10px] text-neutral-400">
        <span>{getTotalVotes(poll.options)} voto{getTotalVotes(poll.options) !== 1 ? "s" : ""}</span>
        <span>
          {isClosed
            ? "Cerrada"
            : `Cierra ${poll.closesAt ? new Date(poll.closesAt).toLocaleDateString("es-CO") : "—"}`}
        </span>
      </div>
    </div>
  );
}

export default PollMessage;
