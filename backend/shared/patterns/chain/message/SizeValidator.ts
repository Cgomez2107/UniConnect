import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import { SizeError } from "../../../libs/errors/SizeError.js";

export class SizeValidator extends MessageValidator {
  constructor(private readonly maxLength: number = 5000) {
    super();
  }

  async validate(content: string, metadata?: ValidationMetadata): Promise<void> {
    const trimmed = content.trim();

    if (!trimmed && !metadata?.mediaUrl) {
      throw new SizeError("Debes enviar texto o una imagen.", "empty");
    }

    if (trimmed.length > this.maxLength) {
      throw new SizeError(
        `Mensaje demasiado largo. Máximo ${this.maxLength} caracteres.`,
        "max_length",
        this.maxLength,
      );
    }

    await this.executeNext(trimmed, metadata);
  }
}
