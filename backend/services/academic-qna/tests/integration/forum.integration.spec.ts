import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createAcademicQnaServer } from "../../src/app/createAcademicQnaServer.js";
import { ForumController } from "../../src/interfaces/http/controllers/ForumController.js";
import {
  CreateQuestionContract,
  CreateQuestionRequestSchema,
  CreateAnswerContract,
  CastVoteContract,
  ListQuestionsContract,
  GetQuestionDetailContract,
  ListAnswersContract,
  MarkSolutionContract,
} from "@uniconnect/shared-types/contracts/forum";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const SUBJECT_ID = "550e8400-e29b-41d4-a716-446655440002";

type UseCaseStub = { execute: ReturnType<typeof vi.fn> };

function buildForumServer() {
  const sampleQuestion = {
    id: UUID,
    subjectId: SUBJECT_ID,
    authorId: USER_ID,
    title: "¿Como resolver integrales dobles?",
    body: "Tengo dudas sobre integrales dobles en calculo vectorial",
    status: "active" as const,
    answerCount: 0,
    voteCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const sampleQuestionSummary = {
    id: UUID,
    subjectId: SUBJECT_ID,
    authorId: USER_ID,
    title: "¿Como resolver integrales dobles?",
    status: "active" as const,
    answerCount: 2,
    voteCount: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const sampleAnswer = {
    id: UUID,
    questionId: UUID,
    authorId: USER_ID,
    body: "Usa el teorema de Green",
    voteCount: 3,
    isSolution: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const createQuestion: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleQuestion),
  };
  const createAnswer: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleAnswer),
  };
  const castVote: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(3),
  };
  const marcarComoSolucion: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(undefined),
  };
  const listQuestions: UseCaseStub = {
    execute: vi.fn().mockResolvedValue([sampleQuestionSummary]),
  };
  const getQuestionDetail: UseCaseStub = {
    execute: vi.fn().mockResolvedValue({
      question: sampleQuestion,
      answers: [sampleAnswer],
    }),
  };
  const listAnswers: UseCaseStub = {
    execute: vi.fn().mockResolvedValue([sampleAnswer]),
  };

  const controller = new ForumController(
    createQuestion as never,
    createAnswer as never,
    castVote as never,
    marcarComoSolucion as never,
    listQuestions as never,
    getQuestionDetail as never,
    listAnswers as never,
  );

  return {
    server: createAcademicQnaServer(controller),
    createQuestion,
    createAnswer,
    castVote,
    marcarComoSolucion,
    listQuestions,
    getQuestionDetail,
    listAnswers,
  };
}

describe("Academic Q&A (Forum) integration /api/v1/forum", () => {
  describe("POST /api/v1/forum/questions", () => {
    it("crea pregunta y valida contrato Zod (AAA)", async () => {
      const { server, createQuestion } = buildForumServer();

      const validBody = {
        subjectId: SUBJECT_ID,
        title: "¿Como resolver integrales dobles?",
        body: "Tengo dudas sobre integrales dobles en calculo vectorial",
      };

      const requestParse = CreateQuestionRequestSchema.safeParse({ body: validBody });
      expect(requestParse.success).toBe(true);

      const response = await request(server as any)
        .post("/api/v1/forum/questions")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send(validBody)
        .expect(201);

      expect(createQuestion.execute).toHaveBeenCalledTimes(1);
      expect(createQuestion.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        subjectId: validBody.subjectId,
        title: validBody.title,
        body: validBody.body,
      });

      const parseResult = CreateQuestionContract.response.safeParse(response.body);
      expect(parseResult.success).toBe(true);
      expect(response.body.data.title).toBe("¿Como resolver integrales dobles?");
    });

    it("rechaza body sin title con error 400", async () => {
      const { server, createQuestion } = buildForumServer();

      await request(server as any)
        .post("/api/v1/forum/questions")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({ subjectId: SUBJECT_ID, body: "Contenido sin titulo" })
        .expect(400);

      expect(createQuestion.execute).not.toHaveBeenCalled();
    });

    it("rechaza request sin x-user-id con 401", async () => {
      const { server, createQuestion } = buildForumServer();

      await request(server as any)
        .post("/api/v1/forum/questions")
        .set("Content-Type", "application/json")
        .send({ subjectId: SUBJECT_ID, title: "Test valido", body: "Test body content for forum question" })
        .expect(401);

      expect(createQuestion.execute).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/forum/questions", () => {
    it("lista preguntas y valida contrato Zod", async () => {
      const { server, listQuestions } = buildForumServer();

      const response = await request(server as any)
        .get("/api/v1/forum/questions")
        .set("x-user-id", USER_ID)
        .expect(200);

      expect(listQuestions.execute).toHaveBeenCalledTimes(1);
      expect(Array.isArray(response.body.data)).toBe(true);

      const parseResult = ListQuestionsContract.response.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    });
  });

  describe("GET /api/v1/forum/questions/:id", () => {
    it("obtiene detalle de pregunta y valida contrato Zod", async () => {
      const { server, getQuestionDetail } = buildForumServer();

      const response = await request(server as any)
        .get(`/api/v1/forum/questions/${UUID}`)
        .set("x-user-id", USER_ID)
        .expect(200);

      expect(getQuestionDetail.execute).toHaveBeenCalledWith(UUID);
      expect(response.body.data).toHaveProperty("question");
      expect(response.body.data).toHaveProperty("answers");

      const parseResult = GetQuestionDetailContract.response.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    });
  });

  describe("POST /api/v1/forum/questions/:id/answers", () => {
    it("crea respuesta y valida contrato Zod", async () => {
      const { server, createAnswer } = buildForumServer();

      const response = await request(server as any)
        .post(`/api/v1/forum/questions/${UUID}/answers`)
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({ body: "Usa el teorema de Green" })
        .expect(201);

      expect(createAnswer.execute).toHaveBeenCalledTimes(1);

      const parseResult = CreateAnswerContract.response.safeParse(response.body);
      expect(parseResult.success).toBe(true);
      expect(response.body.data.body).toBe("Usa el teorema de Green");
    });
  });

  describe("GET /api/v1/forum/questions/:id/answers", () => {
    it("lista respuestas y valida contrato Zod", async () => {
      const { server, listAnswers } = buildForumServer();

      const response = await request(server as any)
        .get(`/api/v1/forum/questions/${UUID}/answers`)
        .set("x-user-id", USER_ID)
        .expect(200);

      expect(listAnswers.execute).toHaveBeenCalledWith(UUID);
      expect(Array.isArray(response.body.data)).toBe(true);

      const parseResult = ListAnswersContract.response.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    });
  });

  describe("POST /api/v1/forum/questions/:id/solution", () => {
    it("marca respuesta como solucion y valida contrato Zod", async () => {
      const { server, marcarComoSolucion } = buildForumServer();

      const response = await request(server as any)
        .post(`/api/v1/forum/questions/${UUID}/solution`)
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({ answerId: UUID })
        .expect(200);

      expect(marcarComoSolucion.execute).toHaveBeenCalledTimes(1);

      const parseResult = MarkSolutionContract.response.safeParse(response.body);
      expect(parseResult.success).toBe(true);
      expect(response.body.data.message).toBe("Respuesta marcada como solución.");
    });
  });

  describe("POST /api/v1/forum/votes", () => {
    it("emite voto y valida contrato Zod", async () => {
      const { server, castVote } = buildForumServer();

      const response = await request(server as any)
        .post("/api/v1/forum/votes")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({
          targetType: "question",
          targetId: UUID,
          voteType: "upvote",
        })
        .expect(200);

      expect(castVote.execute).toHaveBeenCalledTimes(1);

      const parseResult = CastVoteContract.response.safeParse(response.body);
      expect(parseResult.success).toBe(true);
      expect(response.body.data.voteCount).toBe(3);
    });

    it("rechaza voto con targetType invalido", async () => {
      const { server, castVote } = buildForumServer();

      await request(server as any)
        .post("/api/v1/forum/votes")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({
          targetType: "invalid",
          targetId: UUID,
          voteType: "upvote",
        })
        .expect(400);

      expect(castVote.execute).not.toHaveBeenCalled();
    });
  });

  it("GET /health responde 200", async () => {
    const { server } = buildForumServer();
    const response = await request(server as any).get("/health").expect(200);
    expect(response.body.service).toBe("academic-qna");
    expect(response.body.status).toBe("ok");
  });
});
