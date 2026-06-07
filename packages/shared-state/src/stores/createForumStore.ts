import { create } from "zustand";
import type { ForumQuestion, ForumQuestionSummary, ForumAnswer } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";

export interface ForumState {
  // State
  questionsBySubject: Record<string, ForumQuestionSummary[]>;
  activeQuestion: ForumQuestion | null;
  answers: ForumAnswer[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadQuestions(subjectId: string, page?: number, limit?: number): Promise<void>;
  loadQuestionDetail(questionId: string): Promise<void>;
  setQuestions(subjectId: string, questions: ForumQuestionSummary[]): void;
  addQuestion(question: ForumQuestion | ForumQuestionSummary): void;
  updateQuestion(question: ForumQuestion | ForumQuestionSummary): void;
  removeQuestion(questionId: string): void;
  
  addAnswer(answer: ForumAnswer): void;
  updateAnswer(answer: ForumAnswer): void;
  removeAnswer(answerId: string): void;
  setAnswers(answers: ForumAnswer[]): void;
  setError(error: string | null): void;
}

export function createForumStore(deps: StoreDeps) {
  const { apiClients, logger } = deps;

  return create<ForumState>()((set, get) => ({
    questionsBySubject: {},
    activeQuestion: null,
    answers: [],
    isLoading: false,
    error: null,

    async loadQuestions(subjectId: string, page = 1, limit = 20): Promise<void> {
      try {
        set({ isLoading: true, error: null });
        logger?.info(`Loading forum questions for subject ${subjectId}`);

        const client = apiClients.forum;
        if (!client) {
          throw new Error("forum API client not provided");
        }

        const questions = await client.listQuestions(subjectId, page, limit);
        set((state) => ({
          questionsBySubject: {
            ...state.questionsBySubject,
            [subjectId]: questions,
          },
          isLoading: false,
        }));
        logger?.info(`Loaded ${questions.length} questions for subject ${subjectId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load questions";
        set({ error: errorMessage, isLoading: false });
        logger?.error(`Load questions error: ${errorMessage}`);
        throw error;
      }
    },

    async loadQuestionDetail(questionId: string): Promise<void> {
      try {
        set({ isLoading: true, error: null });
        logger?.info(`Loading forum question detail for ID ${questionId}`);

        const client = apiClients.forum;
        if (!client) {
          throw new Error("forum API client not provided");
        }

        const detail = await client.getQuestionDetail(questionId);
        set({
          activeQuestion: detail.question,
          answers: detail.answers,
          isLoading: false,
        });
        logger?.info(`Loaded question detail and ${detail.answers.length} answers for ID ${questionId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load question detail";
        set({ error: errorMessage, isLoading: false });
        logger?.error(`Load question detail error: ${errorMessage}`);
        throw error;
      }
    },

    setQuestions(subjectId: string, questions: ForumQuestionSummary[]): void {
      set((state) => ({
        questionsBySubject: {
          ...state.questionsBySubject,
          [subjectId]: questions,
        },
      }));
      logger?.info(`Forum questions set for subject ${subjectId}: ${questions.length}`);
    },

    addQuestion(question: ForumQuestion | ForumQuestionSummary): void {
      const { subjectId } = question;
      const current = get().questionsBySubject[subjectId] || [];
      if (current.some((q) => q.id === question.id)) return;

      // Map ForumQuestion to ForumQuestionSummary if needed (it has all the required properties)
      const summary: ForumQuestionSummary = {
        id: question.id,
        subjectId: question.subjectId,
        authorId: question.authorId,
        title: question.title,
        status: question.status,
        answerCount: question.answerCount,
        voteCount: question.voteCount,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      };

      set((state) => ({
        questionsBySubject: {
          ...state.questionsBySubject,
          [subjectId]: [summary, ...current],
        },
      }));
      logger?.info(`Forum question added to subject ${subjectId}: ${question.id}`);
    },

    updateQuestion(question: ForumQuestion | ForumQuestionSummary): void {
      const { subjectId } = question;
      const current = get().questionsBySubject[subjectId] || [];
      
      const summary: ForumQuestionSummary = {
        id: question.id,
        subjectId: question.subjectId,
        authorId: question.authorId,
        title: question.title,
        status: question.status,
        answerCount: question.answerCount,
        voteCount: question.voteCount,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      };

      const updatedList = current.map((q) => (q.id === question.id ? { ...q, ...summary } : q));

      set((state) => ({
        questionsBySubject: {
          ...state.questionsBySubject,
          [subjectId]: updatedList,
        },
        activeQuestion:
          state.activeQuestion && state.activeQuestion.id === question.id
            ? { ...state.activeQuestion, ...question }
            : state.activeQuestion,
      }));
      logger?.info(`Forum question updated: ${question.id}`);
    },

    removeQuestion(questionId: string): void {
      const state = get();
      const nextQuestionsBySubject = { ...state.questionsBySubject };

      for (const subjectId of Object.keys(nextQuestionsBySubject)) {
        nextQuestionsBySubject[subjectId] = nextQuestionsBySubject[subjectId].filter(
          (q) => q.id !== questionId
        );
      }

      set({
        questionsBySubject: nextQuestionsBySubject,
        activeQuestion:
          state.activeQuestion?.id === questionId ? null : state.activeQuestion,
      });
      logger?.info(`Forum question removed: ${questionId}`);
    },

    addAnswer(answer: ForumAnswer): void {
      const current = get().answers;
      if (current.some((a) => a.id === answer.id)) return;

      const nextAnswers = [...current, answer];
      const activeQ = get().activeQuestion;

      let nextActiveQuestion = activeQ;
      if (activeQ && activeQ.id === answer.questionId) {
        nextActiveQuestion = {
          ...activeQ,
          answerCount: activeQ.answerCount + 1,
        };
      }

      set({
        answers: nextAnswers,
        activeQuestion: nextActiveQuestion,
      });

      // Also update the question summary count in questionsBySubject
      if (activeQ) {
        const { subjectId } = activeQ;
        const subjectQuestions = get().questionsBySubject[subjectId] || [];
        const nextSubjectQuestions = subjectQuestions.map((q) =>
          q.id === answer.questionId ? { ...q, answerCount: q.answerCount + 1 } : q
        );
        set((state) => ({
          questionsBySubject: {
            ...state.questionsBySubject,
            [subjectId]: nextSubjectQuestions,
          },
        }));
      }

      logger?.info(`Forum answer added: ${answer.id}`);
    },

    updateAnswer(answer: ForumAnswer): void {
      const current = get().answers;
      const nextAnswers = current.map((a) => (a.id === answer.id ? { ...a, ...answer } : a));

      set({
        answers: nextAnswers,
      });
      logger?.info(`Forum answer updated: ${answer.id}`);
    },

    removeAnswer(answerId: string): void {
      const current = get().answers;
      const targetAnswer = current.find((a) => a.id === answerId);
      if (!targetAnswer) return;

      const nextAnswers = current.filter((a) => a.id !== answerId);
      const activeQ = get().activeQuestion;

      let nextActiveQuestion = activeQ;
      if (activeQ && activeQ.id === targetAnswer.questionId) {
        nextActiveQuestion = {
          ...activeQ,
          answerCount: Math.max(0, activeQ.answerCount - 1),
        };
      }

      set({
        answers: nextAnswers,
        activeQuestion: nextActiveQuestion,
      });

      if (activeQ) {
        const { subjectId } = activeQ;
        const subjectQuestions = get().questionsBySubject[subjectId] || [];
        const nextSubjectQuestions = subjectQuestions.map((q) =>
          q.id === targetAnswer.questionId ? { ...q, answerCount: Math.max(0, q.answerCount - 1) } : q
        );
        set((state) => ({
          questionsBySubject: {
            ...state.questionsBySubject,
            [subjectId]: nextSubjectQuestions,
          },
        }));
      }

      logger?.info(`Forum answer removed: ${answerId}`);
    },

    setAnswers(answers: ForumAnswer[]): void {
      set({ answers });
      logger?.info(`Forum answers set: ${answers.length}`);
    },

    setError(error: string | null): void {
      set({ error });
    },
  }));
}
