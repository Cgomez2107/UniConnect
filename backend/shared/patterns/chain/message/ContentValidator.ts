import { MessageValidator } from "./MessageValidator.js";
import { ContentError } from "../../../libs/errors/ContentError.js";

export class ContentValidator extends MessageValidator {
  private readonly forbiddenPatterns: RegExp[];

  constructor(forbiddenWords: string[] = ["spam", "violencia", "odio"]) {
    super();
    this.forbiddenPatterns = forbiddenWords.map(word => new RegExp(word, "gi"));
  }

  async validate(content: string, metadata?: Record<string, unknown>): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) {
      await this.executeNext(content, metadata);
      return;
    }

    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(trimmed)) {
        throw new ContentError("Mensaje rechazado: contiene palabras no permitidas.", "forbidden_words");
      }
    }

    await this.executeNext(trimmed, metadata);
  }
}
