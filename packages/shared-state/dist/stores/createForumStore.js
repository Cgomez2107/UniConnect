import { create } from "zustand";
export function createForumStore(deps) {
    const { apiClients, logger } = deps;
    return create()((set, get) => ({
        questionsBySubject: {},
        activeQuestion: null,
        answers: [],
        isLoading: false,
        error: null,
        async loadQuestions(subjectId, page = 1, limit = 20) {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load questions";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Load questions error: ${errorMessage}`);
                throw error;
            }
        },
        async loadQuestionDetail(questionId) {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load question detail";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Load question detail error: ${errorMessage}`);
                throw error;
            }
        },
        setQuestions(subjectId, questions) {
            set((state) => ({
                questionsBySubject: {
                    ...state.questionsBySubject,
                    [subjectId]: questions,
                },
            }));
            logger?.info(`Forum questions set for subject ${subjectId}: ${questions.length}`);
        },
        addQuestion(question) {
            const { subjectId } = question;
            const current = get().questionsBySubject[subjectId] || [];
            if (current.some((q) => q.id === question.id))
                return;
            // Map ForumQuestion to ForumQuestionSummary if needed (it has all the required properties)
            const summary = {
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
        updateQuestion(question) {
            const { subjectId } = question;
            const current = get().questionsBySubject[subjectId] || [];
            const summary = {
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
                activeQuestion: state.activeQuestion && state.activeQuestion.id === question.id
                    ? { ...state.activeQuestion, ...question }
                    : state.activeQuestion,
            }));
            logger?.info(`Forum question updated: ${question.id}`);
        },
        removeQuestion(questionId) {
            const state = get();
            const nextQuestionsBySubject = { ...state.questionsBySubject };
            for (const subjectId of Object.keys(nextQuestionsBySubject)) {
                nextQuestionsBySubject[subjectId] = nextQuestionsBySubject[subjectId].filter((q) => q.id !== questionId);
            }
            set({
                questionsBySubject: nextQuestionsBySubject,
                activeQuestion: state.activeQuestion?.id === questionId ? null : state.activeQuestion,
            });
            logger?.info(`Forum question removed: ${questionId}`);
        },
        addAnswer(answer) {
            const current = get().answers;
            if (current.some((a) => a.id === answer.id))
                return;
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
                const nextSubjectQuestions = subjectQuestions.map((q) => q.id === answer.questionId ? { ...q, answerCount: q.answerCount + 1 } : q);
                set((state) => ({
                    questionsBySubject: {
                        ...state.questionsBySubject,
                        [subjectId]: nextSubjectQuestions,
                    },
                }));
            }
            logger?.info(`Forum answer added: ${answer.id}`);
        },
        updateAnswer(answer) {
            const current = get().answers;
            const nextAnswers = current.map((a) => (a.id === answer.id ? { ...a, ...answer } : a));
            set({
                answers: nextAnswers,
            });
            logger?.info(`Forum answer updated: ${answer.id}`);
        },
        removeAnswer(answerId) {
            const current = get().answers;
            const targetAnswer = current.find((a) => a.id === answerId);
            if (!targetAnswer)
                return;
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
                const nextSubjectQuestions = subjectQuestions.map((q) => q.id === targetAnswer.questionId ? { ...q, answerCount: Math.max(0, q.answerCount - 1) } : q);
                set((state) => ({
                    questionsBySubject: {
                        ...state.questionsBySubject,
                        [subjectId]: nextSubjectQuestions,
                    },
                }));
            }
            logger?.info(`Forum answer removed: ${answerId}`);
        },
        setAnswers(answers) {
            set({ answers });
            logger?.info(`Forum answers set: ${answers.length}`);
        },
        setError(error) {
            set({ error });
        },
    }));
}
//# sourceMappingURL=createForumStore.js.map