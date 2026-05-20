import { useNavigate } from "react-router-dom";
import { MessageSquare, ChevronRight } from "lucide-react";
import type { ForumQuestionSummary } from "@uniconnect/shared-api";

interface QuestionCardProps {
  question: ForumQuestionSummary;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/forum/pregunta/${question.id}`)}
      className="w-full text-left bg-white rounded-lg border border-neutral-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {question.status === "solved" && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full uppercase tracking-wide">
                Solucionado
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2">
            {question.title}
          </h3>
        </div>
        <ChevronRight size={16} className="text-neutral-300 flex-shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
        <div className="flex items-center gap-1">
          <MessageSquare size={14} />
          <span>{question.answerCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{question.voteCount} votos</span>
        </div>
      </div>
    </button>
  );
}
