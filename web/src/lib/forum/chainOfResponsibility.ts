export interface IForumValidator {
  setNext(validator: IForumValidator): IForumValidator;
  validate(data: Record<string, unknown>): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export abstract class BaseForumValidator implements IForumValidator {
  private next: IForumValidator | null = null;

  setNext(validator: IForumValidator): IForumValidator {
    this.next = validator;
    return validator;
  }

  async validate(data: Record<string, unknown>): Promise<ValidationResult> {
    const result = await this.doValidate(data);
    if (!result.isValid) return result;
    if (this.next) return this.next.validate(data);
    return { isValid: true };
  }

  protected abstract doValidate(data: Record<string, unknown>): Promise<ValidationResult>;
}

export class EnrollmentValidator extends BaseForumValidator {
  constructor(private isEnrolled: (subjectId: string) => Promise<boolean>) {
    super();
  }

  protected async doValidate(data: Record<string, unknown>): Promise<ValidationResult> {
    const subjectId = data.subjectId as string | undefined;
    if (!subjectId) {
      return { isValid: false, error: "El ID de la asignatura es requerido." };
    }
    const enrolled = await this.isEnrolled(subjectId);
    if (!enrolled) {
      return { isValid: false, error: "Debes estar matriculado en esta asignatura para participar en el foro." };
    }
    return { isValid: true };
  }
}

export class ContentValidator extends BaseForumValidator {
  protected async doValidate(data: Record<string, unknown>): Promise<ValidationResult> {
    const title = data.title as string | undefined;
    const body = data.body as string | undefined;

    if (!title || title.trim().length === 0) {
      return { isValid: false, error: "El título es requerido." };
    }
    if (title.trim().length < 5) {
      return { isValid: false, error: "El título debe tener al menos 5 caracteres." };
    }
    if (title.length > 200) {
      return { isValid: false, error: "El título no puede superar los 200 caracteres." };
    }
    if (!body || body.trim().length === 0) {
      return { isValid: false, error: "El contenido de la pregunta es requerido." };
    }
    if (body.trim().length < 10) {
      return { isValid: false, error: "El contenido debe tener al menos 10 caracteres." };
    }
    if (body.length > 5000) {
      return { isValid: false, error: "El contenido no puede superar los 5000 caracteres." };
    }

    const forbiddenWords = ["spam", "ofensa"];
    for (const word of forbiddenWords) {
      if (body.toLowerCase().includes(word)) {
        return { isValid: false, error: `El contenido contiene palabras no permitidas.` };
      }
    }

    return { isValid: true };
  }
}

export class ForumValidatorFactory {
  static createQuestionChain(isEnrolled: (subjectId: string) => Promise<boolean>): IForumValidator {
    const enrollment = new EnrollmentValidator(isEnrolled);
    const content = new ContentValidator();
    enrollment.setNext(content);
    return enrollment;
  }
}
