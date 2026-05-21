import { BaseValidator } from "./BaseValidator";
import type { ValidationMetadata } from "./IValidationHandler";

const MENTION_REGEX = /@(\w+)/g;

export class MentionValidator extends BaseValidator {
  private readonly maxMentions: number;

  constructor(maxMentions: number = 10) {
    super();
    this.maxMentions = maxMentions;
  }

  async validate(content: string, _metadata?: ValidationMetadata): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    const mentions = trimmed.match(MENTION_REGEX);
    if (mentions && mentions.length > this.maxMentions) {
      const error = new Error(`El mensaje excede el límite de ${this.maxMentions} menciones.`);
      error.name = "MENTIONS_LIMIT_EXCEEDED";
      throw error;
    }
  }
}
