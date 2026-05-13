import { MessageValidator } from "./MessageValidator.js";
import { SizeValidator } from "./SizeValidator.js";
import { ContentValidator } from "./ContentValidator.js";
import { MediaValidator } from "./MediaValidator.js";

export class ValidatorFactory {
  static createChain(maxLength?: number, forbiddenWords?: string[]): MessageValidator {
    const size = new SizeValidator(maxLength);
    const content = new ContentValidator(forbiddenWords);
    const media = new MediaValidator();

    size.setNext(content);
    content.setNext(media);

    return size;
  }
}
