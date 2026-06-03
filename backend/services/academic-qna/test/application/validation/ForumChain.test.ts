import { ForumQuestionCoRFactory } from "../../../src/application/validation/ForumQuestionCoRFactory.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";
import { ContentError } from "../../../../../shared/libs/errors/ContentError.js";
import type { IEnrollmentRepository } from "../../../src/domain/repositories/IEnrollmentRepository.js";

function mockEnrollmentRepo(enrolled: boolean): IEnrollmentRepository {
  return { isEnrolled: jest.fn().mockResolvedValue(enrolled) };
}

describe("ForumQuestionCoR Chain of Responsibility", () => {
  const userId = "user-1";
  const subjectId = "subject-1";

  describe("Test 1: EnrollmentValidatorHandler", () => {
    it("debe fallar si el usuario NO está matriculado", async () => {
      const chain = ForumQuestionCoRFactory.createPublicationChain();
      const enrollmentRepo = mockEnrollmentRepo(false);

      await expect(
        chain.validate({ userId, subjectId, body: "contenido valido", enrollmentRepo }),
      ).rejects.toThrow(AuthorizationError);

      expect(enrollmentRepo.isEnrolled).toHaveBeenCalledWith(userId, subjectId);
    });
  });

  describe("Test 2: FormatValidatorHandler", () => {
    it("debe fallar si el cuerpo excede los 5000 caracteres", async () => {
      const chain = ForumQuestionCoRFactory.createPublicationChain();
      const enrollmentRepo = mockEnrollmentRepo(true);

      await expect(
        chain.validate({
          userId,
          subjectId,
          body: "x".repeat(5001),
          enrollmentRepo,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Test 3: Cadena completa exitosa", () => {
    it("debe pasar si todos los validadores devuelven éxito", async () => {
      const chain = ForumQuestionCoRFactory.createPublicationChain();
      const enrollmentRepo = mockEnrollmentRepo(true);

      await expect(
        chain.validate({
          userId,
          subjectId,
          title: "Titulo valido",
          body: "Cuerpo valido sin palabras prohibidas.",
          enrollmentRepo,
        }),
      ).resolves.toBeUndefined();
    });
  });
});