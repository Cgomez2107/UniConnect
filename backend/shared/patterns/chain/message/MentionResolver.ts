import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";

export interface IAdminResolver {
  getCurrentAdminId(requestId: string): Promise<string | null>;
}

export class MentionResolver extends MessageValidator {
  constructor(private readonly adminResolver: IAdminResolver) {
    super();
  }

  async validate(content: string, metadata?: ValidationMetadata): Promise<void> {
    if (metadata?.isGroup && metadata.requestId && content.includes("@admin")) {
      const adminId = await this.adminResolver.getCurrentAdminId(metadata.requestId);

      if (adminId) {
        const resolved = content.replace(/@admin\b/g, `@${adminId}`);
        await this.executeNext(resolved, metadata);
        return;
      }
    }

    await this.executeNext(content, metadata);
  }
}
