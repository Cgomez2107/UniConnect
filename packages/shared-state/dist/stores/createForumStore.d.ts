import type { ForumQuestion, ForumQuestionSummary, ForumAnswer } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";
export interface ForumState {
    questionsBySubject: Record<string, ForumQuestionSummary[]>;
    activeQuestion: ForumQuestion | null;
    answers: ForumAnswer[];
    isLoading: boolean;
    error: string | null;
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
export declare function createForumStore(deps: StoreDeps): import("zustand").UseBoundStore<import("zustand").StoreApi<ForumState>>;
//# sourceMappingURL=createForumStore.d.ts.map