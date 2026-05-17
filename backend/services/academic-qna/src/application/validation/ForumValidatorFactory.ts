import { EnrollmentValidator } from './EnrollmentValidator.js';
import { FormatValidator } from './FormatValidator.js';
import { ContentValidator } from './ContentValidator.js';
import { type ValidationContext } from './ForumValidator.js';

export class ForumValidatorFactory {
  static createPublicationChain(): { validate(context: ValidationContext): Promise<void> } {
    const enrollment = new EnrollmentValidator();
    const format = new FormatValidator();
    const content = new ContentValidator();

    enrollment.setNext(format).setNext(content);

    return enrollment;
  }
}
