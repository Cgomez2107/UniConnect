import type { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository.js';

export interface ValidationContext {
  userId: string;
  subjectId: string;
  title?: string;
  body: string;
  enrollmentRepo: IEnrollmentRepository;
}

export abstract class ForumValidator {
  protected next: ForumValidator | null = null;

  setNext(validator: ForumValidator): ForumValidator {
    this.next = validator;
    return validator;
  }

  abstract validate(context: ValidationContext): Promise<void>;

  protected async executeNext(context: ValidationContext): Promise<void> {
    if (this.next) {
      await this.next.validate(context);
    }
  }
}
