import { useState, useEffect, useCallback } from "react";
import { DIContainer } from "@/lib/services/di/container";
import type { ForumQuestion, ForumQuestionSummary, ForumAnswer } from "@/types";

const container = DIContainer.getInstance();

export function useForum(subjectId?: string) {
  const [questions, setQuestions] = useState<ForumQuestionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await container.getListForumQuestions().execute(subjectId);
      setQuestions(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar preguntas.");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const createQuestion = async (title: string, body: string) => {
    if (!subjectId) throw new Error("Asignatura no seleccionada.");
    const result = await container.getCreateForumQuestion().execute(subjectId, title, body);
    await loadQuestions();
    return result;
  };

  return { questions, loading, error, createQuestion, refresh: loadQuestions };
}

export function useForumQuestion(questionId?: string) {
  const [question, setQuestion] = useState<ForumQuestion | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await container.getGetForumQuestionDetail().execute(questionId);
      setQuestion(detail.question);
      setAnswers(detail.answers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la pregunta.");
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const createAnswer = async (body: string) => {
    if (!questionId) throw new Error("Pregunta no identificada.");
    const result = await container.getCreateForumAnswer().execute(questionId, body);
    setAnswers((prev) => [...prev, result]);
    return result;
  };

  const castVote = async (targetType: "question" | "answer", targetId: string) => {
    const result = await container.getVoteForum().execute(targetType, targetId, "upvote");
    if (targetType === "question" && question) {
      setQuestion({ ...question, vote_count: result.voteCount });
    } else {
      setAnswers((prev) =>
        prev.map((a) => (a.id === targetId ? { ...a, vote_count: result.voteCount } : a))
      );
    }
  };

  const markAsSolution = async (answerId: string) => {
    if (!questionId) return;
    await container.getMarkForumSolution().execute(questionId, answerId);
    await loadDetail();
  };

  const orderedAnswers = [...answers].sort((a, b) => {
    if (a.is_solution && !b.is_solution) return -1;
    if (!a.is_solution && b.is_solution) return 1;
    return b.vote_count - a.vote_count;
  });

  return {
    question,
    answers: orderedAnswers,
    loading,
    error,
    createAnswer,
    castVote,
    markAsSolution,
    refresh: loadDetail,
  };
}
