import { EnrollmentValidatorHandler } from './EnrollmentValidatorHandler.js';
import { FormatValidatorHandler } from './FormatValidatorHandler.js';
import { ContentValidatorHandler } from './ContentValidatorHandler.js';
import { type IForumQuestionHandler } from './ForumQuestionHandler.js';

export class ForumQuestionCoRFactory {
  static createPublicationChain(): IForumQuestionHandler {
    const enrollment = new EnrollmentValidatorHandler();
    const format = new FormatValidatorHandler();
    const content = new ContentValidatorHandler();

    enrollment.setNext(format).setNext(content);

    return enrollment;
  }
}