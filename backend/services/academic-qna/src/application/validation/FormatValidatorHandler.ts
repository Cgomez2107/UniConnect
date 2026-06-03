import { ValidationError } from '../../../../../shared/libs/errors/ValidationError.js';
import { BaseForumQuestionHandler, type ValidationContext } from './ForumQuestionHandler.js';

export class FormatValidatorHandler extends BaseForumQuestionHandler {
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