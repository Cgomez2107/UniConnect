import { AuthorizationError } from '../../../../../shared/libs/errors/AuthorizationError.js';
import { BaseForumQuestionHandler, type ValidationContext } from './ForumQuestionHandler.js';

export class EnrollmentValidatorHandler extends BaseForumQuestionHandler {
  async validate(context: ValidationContext): Promise<void> {
    const enrolled = await context.enrollmentRepo.isEnrolled(context.userId, context.subjectId);

    if (!enrolled) {
      throw new AuthorizationError('No estás matriculado en esta asignatura.');
    }

    await this.executeNext(context);
  }
}