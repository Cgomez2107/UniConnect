import { ValidationError } from '../../../../../shared/libs/errors/ValidationError.js';
import { ForumValidator, type ValidationContext } from './ForumValidator.js';

export class FormatValidator extends ForumValidator {
  async validate(context: ValidationContext): Promise<void> {
    if (context.title !== undefined && context.title.length > 200) {
      throw new ValidationError('El título no puede exceder los 200 caracteres.');
    }

    if (context.body.length > 5000) {
      throw new ValidationError('El cuerpo no puede exceder los 5000 caracteres.');
    }

    await this.executeNext(context);
  }
}
