import type { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository.js';

export interface ValidationContext {
  userId: string;
  subjectId: string;
  title?: string;
  body: string;
  enrollmentRepo: IEnrollmentRepository;
}

export interface IForumQuestionHandler {
  setNext(handler: IForumQuestionHandler): IForumQuestionHandler;
  validate(context: ValidationContext): Promise<void>;
}

export abstract class BaseForumQuestionHandler implements IForumQuestionHandler {
  protected next: IForumQuestionHandler | null = null;

  setNext(handler: IForumQuestionHandler): IForumQuestionHandler {
    this.next = handler;
    return handler;
  }

  abstract validate(context: ValidationContext): Promise<void>;

  protected async executeNext(context: ValidationContext): Promise<void> {
    if (this.next) {
      await this.next.validate(context);
    }
  }
}