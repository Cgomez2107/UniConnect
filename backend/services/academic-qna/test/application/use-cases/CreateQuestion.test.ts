import { CreateQuestion } from "../../../src/application/use-cases/CreateQuestion.js";
import type { IForumQuestionRepository } from "../../../src/domain/repositories/IForumQuestionRepository.js";
import type { IEnrollmentRepository } from "../../../src/domain/repositories/IEnrollmentRepository.js";
import type { ForumQuestion } from "../../../src/domain/entities/ForumQuestion.js";

describe("CreateQuestion use case", () => {
  it("debe llamar a questionRepo.create exactamente una vez si la validación pasa", async () => {
    const fakeQuestion: ForumQuestion = {
      id: "q-1",
      subjectId: "subject-1",
      authorId: "user-1",
      title: "Titulo valido",
      body: "Cuerpo valido.",
      status: "active",
      answerCount: 0,
      voteCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const questionRepo: IForumQuestionRepository = {
      create: jest.fn().mockResolvedValue(fakeQuestion),
      findById: jest.fn(),
      findSummariesBySubject: jest.fn(),
      findBySubject: jest.fn(),
      incrementAnswerCount: jest.fn(),
      markAsSolved: jest.fn(),
      isAdminOfStudyGroup: jest.fn(),
    };

    const enrollmentRepo: IEnrollmentRepository = {
      isEnrolled: jest.fn().mockResolvedValue(true),
    };

    const useCase = new CreateQuestion(questionRepo, enrollmentRepo);

    const result = await useCase.execute({
      userId: "user-1",
      subjectId: "subject-1",
      title: "Titulo valido",
      body: "Cuerpo valido.",
    });

    expect(questionRepo.create).toHaveBeenCalledTimes(1);
    expect(questionRepo.create).toHaveBeenCalledWith({
      subjectId: "subject-1",
      authorId: "user-1",
      title: "Titulo valido",
      body: "Cuerpo valido.",
      status: "active",
      answerCount: 0,
      voteCount: 0,
    });
    expect(result).toEqual(fakeQuestion);
  });
});
