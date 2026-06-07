import { CheckCircle, Pin, ThumbsUp } from "lucide-react";

interface AnswerItemProps {
  id: string;
  authorName: string;
  body: string;
  voteCount: number;
  isPinned: boolean;
  isSolution: boolean;
  createdAt: string;
  currentUserId?: string;
  isAdmin: boolean;
  isQuestionAuthor: boolean;
  userVote?: "upvote" | "downvote" | null;
  onVote: (answerId: string) => Promise<void>;
  onMarkSolution: (answerId: string) => Promise<void>;
  onPinAnswer?: (answerId: string) => Promise<void>;
}

export function AnswerItem({
  id,
  authorName,
  body,
  voteCount,
  isPinned,
  isSolution,
  createdAt,
  currentUserId,
  isAdmin,
  isQuestionAuthor,
  userVote,
  onVote,
  onMarkSolution,
  onPinAnswer,
}: AnswerItemProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        isPinned
          ? "border-yellow-300 bg-yellow-50"
          : isSolution
          ? "border-green-300 bg-green-50"
          : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1 min-w-[48px]">
          <button
            onClick={() => onVote(id)}
            className={`p-1.5 rounded-full transition-all ${
              userVote === "upvote"
                ? "bg-primary-100 text-primary-600"
                : "text-neutral-400 hover:text-primary-500 hover:bg-neutral-100"
            }`}
            aria-label="Votar"
          >
            <ThumbsUp size={20} fill={userVote === "upvote" ? "currentColor" : "none"} />
          </button>
          <span className={`text-sm font-semibold tabular-nums ${voteCount > 0 ? "text-neutral-900" : "text-neutral-400"}`}>
            {voteCount}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-neutral-500">
              {authorName}
            </span>
            <span className="text-xs text-neutral-300">&middot;</span>
            <span className="text-xs text-neutral-400">
              {new Date(createdAt).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                <Pin size={10} />
                Respuesta del Profesor
              </span>
            )}
            {isSolution && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full">
                <CheckCircle size={10} />
                Solución
              </span>
            )}
            {(isAdmin || isQuestionAuthor) && !isSolution && !isPinned && (
              <>
                <button
                  onClick={() => onMarkSolution(id)}
                  className="ml-auto text-[10px] font-semibold text-primary-600 hover:text-primary-700"
                >
                  Marcar como solución
                </button>
                {isAdmin && onPinAnswer && (
                  <button
                    onClick={() => onPinAnswer(id)}
                    className="text-[10px] font-semibold text-yellow-600 hover:text-yellow-700"
                  >
                    Fijar respuesta
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
