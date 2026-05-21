import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { MarcarComoSolucion } from "../../../src/application/use-cases/MarcarComoSolucion.js";
import type { IForumQuestionRepository } from "../../../src/domain/repositories/IForumQuestionRepository.js";
import type { IForumAnswerRepository } from "../../../src/domain/repositories/IForumAnswerRepository.js";
import type { ForumQuestion } from "../../../src/domain/entities/ForumQuestion.js";
import type { ForumAnswer } from "../../../src/domain/entities/ForumAnswer.js";
import { ForumSubject } from "../../../src/domain/events/ForumSubject.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";

const USER_A = "user-a-admin";
const USER_B = "user-b-asker";
const USER_C = "user-c-answerer";
const QUESTION_ID = "question-1";
const ANSWER_ID = "answer-1";

function makeQuestion(overrides?: Partial<ForumQuestion>): ForumQuestion {
  return {
    id: QUESTION_ID,
    subjectId: "study-group-1",
    authorId: USER_B,
    title: "¿Cómo resolver este problema?",
    body: "No entiendo la tarea 3.",
    status: "active",
    answerCount: 1,
    voteCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeAnswer(overrides?: Partial<ForumAnswer>): ForumAnswer {
  return {
    id: ANSWER_ID,
    questionId: QUESTION_ID,
    authorId: USER_C,
    body: "La respuesta es 42.",
    voteCount: 1,
    isSolution: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("V05 — MarcarComoSolucion", () => {
  let questionRepo: jest.Mocked<IForumQuestionRepository>;
  let answerRepo: jest.Mocked<IForumAnswerRepository>;
  let forumSubject: ForumSubject;
  let useCase: MarcarComoSolucion;

  beforeEach(() => {
    questionRepo = {
      create: jest.fn<any>(),
      findById: jest.fn<any>(),
      findSummariesBySubject: jest.fn<any>(),
      findBySubject: jest.fn<any>(),
      incrementAnswerCount: jest.fn<any>(),
      markAsSolved: jest.fn<any>(),
      isAdminOfStudyGroup: jest.fn<any>(),
    };

    answerRepo = {
      create: jest.fn<any>(),
      findById: jest.fn<any>(),
      findByQuestion: jest.fn<any>(),
      markAsSolution: jest.fn<any>(),
    };

    forumSubject = new ForumSubject();
    jest.spyOn(forumSubject, "emitSolucionEvent").mockResolvedValue(undefined);

    useCase = new MarcarComoSolucion(questionRepo, answerRepo, forumSubject);
  });

  it("debe rechazar si la pregunta no existe", async () => {
    questionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ questionId: QUESTION_ID, answerId: ANSWER_ID, userId: USER_A }),
    ).rejects.toThrow(NotFoundError);
  });

  it("debe rechazar si la respuesta no existe", async () => {
    questionRepo.findById.mockResolvedValue(makeQuestion());
    answerRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ questionId: QUESTION_ID, answerId: ANSWER_ID, userId: USER_A }),
    ).rejects.toThrow(NotFoundError);
  });

  it("debe rechazar si el usuario no es admin del grupo", async () => {
    questionRepo.findById.mockResolvedValue(makeQuestion());
    answerRepo.findById.mockResolvedValue(makeAnswer());
    questionRepo.isAdminOfStudyGroup.mockResolvedValue(false);

    await expect(
      useCase.execute({ questionId: QUESTION_ID, answerId: ANSWER_ID, userId: USER_C }),
    ).rejects.toThrow(AuthorizationError);
  });

  it("debe marcar como solución cuando el admin original (User A) lo hace", async () => {
    questionRepo.findById.mockResolvedValue(makeQuestion());
    answerRepo.findById.mockResolvedValue(makeAnswer());
    questionRepo.isAdminOfStudyGroup.mockResolvedValue(true);

    await useCase.execute({ questionId: QUESTION_ID, answerId: ANSWER_ID, userId: USER_A });

    expect(questionRepo.markAsSolved).toHaveBeenCalledWith(QUESTION_ID);
    expect(answerRepo.markAsSolution).toHaveBeenCalledWith(ANSWER_ID);
    expect(forumSubject.emitSolucionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SOLUCION_MARCADA",
        questionId: QUESTION_ID,
        answerId: ANSWER_ID,
        marcadoPor: USER_A,
        answerAuthorId: USER_C,
      }),
    );
  });

  it("debe permitir marcar solución al nuevo admin tras transferencia ST01 (User B)", async () => {
    questionRepo.findById.mockResolvedValue(makeQuestion());
    answerRepo.findById.mockResolvedValue(makeAnswer());
    questionRepo.isAdminOfStudyGroup.mockResolvedValue(true);

    await useCase.execute({ questionId: QUESTION_ID, answerId: ANSWER_ID, userId: USER_B });

    expect(questionRepo.markAsSolved).toHaveBeenCalledWith(QUESTION_ID);
    expect(answerRepo.markAsSolution).toHaveBeenCalledWith(ANSWER_ID);
    expect(forumSubject.emitSolucionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        marcadoPor: USER_B,
        answerAuthorId: USER_C,
      }),
    );
  });

  it("debe emitir notificación al autor de la respuesta (User C) con prioridad normal", async () => {
    questionRepo.findById.mockResolvedValue(makeQuestion());
    answerRepo.findById.mockResolvedValue(makeAnswer());
    questionRepo.isAdminOfStudyGroup.mockResolvedValue(true);

    await useCase.execute({ questionId: QUESTION_ID, answerId: ANSWER_ID, userId: USER_A });

    expect(answerRepo.markAsSolution).toHaveBeenCalledWith(ANSWER_ID);
    expect(forumSubject.emitSolucionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        answerAuthorId: USER_C,
      }),
    );
  });
});
