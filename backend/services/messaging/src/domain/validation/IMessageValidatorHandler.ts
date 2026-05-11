export interface ValidationResult {
  readonly isValid: boolean;
  readonly errorCode?: string;
}

export interface ValidatableMessage {
  readonly content: string;
  readonly senderId: string;
  readonly mentionedUserIds: string[];
  readonly conversationId: string;
  readonly metadata: Record<string, unknown>;
}

export interface IMessageValidatorHandler {
  setNext(handler: IMessageValidatorHandler): IMessageValidatorHandler;
  handle(message: ValidatableMessage): Promise<ValidationResult>;
}
