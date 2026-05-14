import { AuthorizationError } from '../../../../../shared/libs/errors/AuthorizationError.js';
import { ForumValidator, type ValidationContext } from './ForumValidator.js';

export class EnrollmentValidator extends ForumValidator {
  async validate(context: ValidationContext): Promise<void> {
    const enrolled = await context.enrollmentRepo.isEnrolled(context.userId, context.subjectId);

    if (!enrolled) {
      throw new AuthorizationError('No estás matriculado en esta asignatura.');
    }

    await this.executeNext(context);
  }
}
