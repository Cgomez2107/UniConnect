import { ContentError } from '../../../../../shared/libs/errors/ContentError.js';
import { BaseForumQuestionHandler, type ValidationContext } from './ForumQuestionHandler.js';

const FORBIDDEN_WORDS = ['spam', 'ofensa'];

export class ContentValidatorHandler extends BaseForumQuestionHandler {
  async validate(context: ValidationContext): Promise<void> {
    const trimmed = context.body.trim();

    if (trimmed.length === 0) {
      throw new ContentError('El cuerpo no puede estar vacío.', 'empty_body');
    }

    const lower = trimmed.toLowerCase();

    for (const word of FORBIDDEN_WORDS) {
      if (lower.includes(word)) {
        throw new ContentError(`El contenido contiene una palabra no permitida: "${word}".`, 'forbidden_words');
      }
    }

    await this.executeNext(context);
  }
}