export interface ValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface ValidationMetadata {
  mediaUrl?: string;
  mediaType?: string;
  mediaFilename?: string;
  senderId?: string;
  requestId?: string;
  isGroup?: boolean;
}

export interface IValidationHandler {
  setNext(handler: IValidationHandler): IValidationHandler;
  setSiguiente(handler: IValidationHandler): IValidationHandler;
  handle(content: string, metadata?: ValidationMetadata): Promise<ValidationResult>;
  validate(content: string, metadata?: ValidationMetadata): Promise<void>;
}
