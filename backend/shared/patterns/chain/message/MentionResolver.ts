import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export interface IAdminResolver {
  getCurrentAdminId(requestId: string): Promise<string | null>;
}

export class MentionResolver extends MessageValidator {
  constructor(private readonly adminResolver: IAdminResolver) {
    super();
  }

  protected async validar(content: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    if (metadata?.isGroup && metadata.requestId && content.includes("@admin")) {
      const adminId = await this.adminResolver.getCurrentAdminId(metadata.requestId);

      if (adminId) {
        const resolved = content.replace(/@admin\b/g, `@${adminId}`);
        return { valido: true, contenidoModificado: resolved };
      }
    }

    return { valido: true };
  }
}