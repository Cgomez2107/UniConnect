import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { forumService } from "@/lib/forum/forum.service";
import { ordenarRespuestas } from "@/lib/forum/orderingLogic";
import { AnswerItem } from "@/components/forum/AnswerItem";
import { AnswerForm } from "@/components/forum/AnswerForm";
import type { ForumQuestion, ForumAnswer } from "@uniconnect/shared-api";

export function ForumQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [question, setQuestion] = useState<ForumQuestion | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionUserVote, setQuestionUserVote] = useState<"upvote" | "downvote" | null>(null);

  const loadQuestion = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await forumService.getQuestionDetail(id);
      setQuestion(detail.question);
      setAnswers(detail.answers);
      setQuestionUserVote(detail.question.userVote ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la pregunta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuestion(); }, [id]);

  const handleVote = async (targetId: string, targetType: "question" | "answer") => {
    try {
      const result = await forumService.castVote({
        targetType,
        targetId,
        voteType: "upvote",
      });
      if (targetType === "question" && question) {
        setQuestion({ ...question, voteCount: result.voteCount });
        setQuestionUserVote((prev) => (prev === "upvote" ? null : "upvote"));
      } else {
        setAnswers((prev) =>
          prev.map((a) => {
            if (a.id !== targetId) return a;
            const userVote = a.userVote === "upvote" ? null : "upvote" as const;
            return { ...a, voteCount: result.voteCount, userVote };
          })
        );
      }
    } catch {
      // handled by service
    }
  };

  const handleAnswerVote = async (answerId: string) => {
    await handleVote(answerId, "answer");
  };

  const handleMarkSolution = async (answerId: string) => {
    if (!id) return;
    try {
      await forumService.markAsSolution(id, answerId);
      await loadQuestion();
    } catch {
      // handled
    }
  };

  const handlePinAnswer = async (answerId: string) => {
    if (!id) return;
    try {
      await forumService.pinAnswer(id, answerId);
      await loadQuestion();
    } catch {
      // handled
    }
  };

  const handleSubmitAnswer = async (body: string) => {
    if (!id) return;
    const newAnswer = await forumService.createAnswer(id, { body });
    setAnswers((prev) => [...prev, newAnswer]);
  };

  const orderedAnswers = ordenarRespuestas(answers.map((a) => ({
    ...a,
    isPinned: a.isPinned ?? false,
    isSolution: a.isSolution ?? false,
  })));

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="h-8 w-48 skeleton rounded mb-4" />
          <div className="h-4 w-full skeleton rounded mb-2" />
          <div className="h-4 w-3/4 skeleton rounded mb-8" />
          <div className="h-32 skeleton rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-neutral-50 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm">
            {error || "Pregunta no encontrada."}
          </div>
          <button
            onClick={() => navigate("/forum")}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Volver al foro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/forum")}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <ArrowLeft size={16} />
          Volver al foro
        </button>

        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => handleVote(question.id, "question")}
              className={`p-1.5 rounded-full transition-all ${
                questionUserVote === "upvote"
                  ? "bg-primary-100 text-primary-600"
                  : "text-neutral-400 hover:text-primary-500 hover:bg-neutral-100"
              }`}
              aria-label="Votar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={questionUserVote === "upvote" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {question.status === "solved" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full">
                    <CheckCircle size={10} />
                    Solucionado
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-neutral-900 mb-2">
                {question.title}
              </h1>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words mb-4">
                {question.body}
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <span>{question.voteCount} votos</span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  {question.answerCount} respuesta{question.answerCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-base font-semibold text-neutral-900 mb-4">
          {answers.length} respuesta{answers.length !== 1 ? "s" : ""}
        </h2>

        <div className="space-y-4 mb-8">
          {orderedAnswers.map((answer) => (
            <AnswerItem
              key={answer.id}
              id={answer.id}
              authorName={answer.authorName}
              body={answer.body}
              voteCount={answer.voteCount}
              isPinned={answer.isPinned ?? false}
              isSolution={answer.isSolution ?? false}
              createdAt={answer.createdAt}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              userVote={answer.userVote ?? null}
              onVote={handleAnswerVote}
              onMarkSolution={handleMarkSolution}
              onPinAnswer={handlePinAnswer}
            />
          ))}
        </div>

        <AnswerForm onSubmit={handleSubmitAnswer} />
      </div>
    </div>
  );
}

export default ForumQuestionPage;
