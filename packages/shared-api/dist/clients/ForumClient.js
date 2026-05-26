import { BaseClient } from "./BaseClient.js";
export class ForumClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async createQuestion(data) {
        const response = await this.transport.request({
            method: "POST",
            url: "/forum/questions",
            body: data,
        });
        return response.data;
    }
    async listQuestions(subjectId, page = 1, limit = 20) {
        const response = await this.transport.request({
            method: "GET",
            url: "/forum/questions",
            params: { subjectId, page: String(page), limit: String(limit) },
        });
        return response.data;
    }
    async getQuestionDetail(id) {
        const response = await this.transport.request({
            method: "GET",
            url: `/forum/questions/${id}`,
        });
        return response.data;
    }
    async createAnswer(questionId, data) {
        const response = await this.transport.request({
            method: "POST",
            url: `/forum/questions/${questionId}/answers`,
            body: data,
        });
        return response.data;
    }
    async listAnswers(questionId) {
        const response = await this.transport.request({
            method: "GET",
            url: `/forum/questions/${questionId}/answers`,
        });
        return this.ensureArray(response.data);
    }
    async castVote(data) {
        const response = await this.transport.request({
            method: "POST",
            url: "/forum/votes",
            body: data,
        });
        return response.data;
    }
    async markAsSolution(questionId, data) {
        await this.transport.request({
            method: "POST",
            url: `/forum/questions/${questionId}/solution`,
            body: data,
        });
    }
    async pinAnswer(questionId, answerId) {
        await this.transport.request({
            method: "PATCH",
            url: `/forum/questions/${questionId}/answers/${answerId}/pin`,
        });
    }
}
//# sourceMappingURL=ForumClient.js.map