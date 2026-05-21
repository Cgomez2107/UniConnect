import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
export interface ForumQuestion {
    id: string;
    subjectId: string;
    authorId: string;
    title: string;
    body: string;
    status: "active" | "solved";
    answerCount: number;
    voteCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface ForumQuestionSummary {
    id: string;
    subjectId: string;
    authorId: string;
    title: string;
    status: "active" | "solved";
    answerCount: number;
    voteCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface ForumAnswer {
    id: string;
    questionId: string;
    authorId: string;
    body: string;
    voteCount: number;
    isSolution: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateQuestionPayload {
    subjectId: string;
    title: string;
    body: string;
}
export interface CreateAnswerPayload {
    body: string;
}
export interface CastVotePayload {
    targetType: "question" | "answer";
    targetId: string;
    voteType: "upvote" | "downvote";
}
export interface MarkSolutionPayload {
    answerId: string;
}
export declare class ForumClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    createQuestion(data: CreateQuestionPayload): Promise<ForumQuestion>;
    listQuestions(subjectId: string, page?: number, limit?: number): Promise<ForumQuestionSummary[]>;
    getQuestionDetail(id: string): Promise<{
        question: ForumQuestion;
        answers: ForumAnswer[];
    }>;
    createAnswer(questionId: string, data: CreateAnswerPayload): Promise<ForumAnswer>;
    listAnswers(questionId: string): Promise<ForumAnswer[]>;
    castVote(data: CastVotePayload): Promise<{
        voteCount: number;
    }>;
    markAsSolution(questionId: string, data: MarkSolutionPayload): Promise<void>;
}
//# sourceMappingURL=ForumClient.d.ts.map