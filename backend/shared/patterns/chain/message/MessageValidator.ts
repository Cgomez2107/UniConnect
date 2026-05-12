export interface ValidationMetadata {
  mediaUrl?: string;
  mediaType?: string;
  mediaFilename?: string;
}

export abstract class MessageValidator {
  protected next: MessageValidator | null = null;

  setNext(validator: MessageValidator): MessageValidator {
    this.next = validator;
    return validator;
  }

  abstract validate(content: string, metadata?: ValidationMetadata): Promise<void>;

  protected async executeNext(content: string, metadata?: ValidationMetadata): Promise<void> {
    if (this.next) {
      await this.next.validate(content, metadata);
    }
  }
}
