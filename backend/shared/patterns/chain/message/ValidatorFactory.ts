import { MessageValidator } from "./MessageValidator.js";
import { SizeValidator } from "./SizeValidator.js";
import { ContentValidator } from "./ContentValidator.js";
import { MediaValidator } from "./MediaValidator.js";
import { PermissionValidator, type IGroupPermissionRepository } from "./PermissionValidator.js";
import { MentionResolver, type IAdminResolver } from "./MentionResolver.js";

export class ValidatorFactory {
  static createChain(
    maxLength?: number,
    forbiddenWords?: string[],
    permissionRepo?: IGroupPermissionRepository,
    adminResolver?: IAdminResolver,
  ): MessageValidator {
    const resolvedMaxLength = resolveMaxLength(maxLength);
    const resolvedForbiddenWords = resolveForbiddenWords(forbiddenWords);

    const chain = new SizeValidator(resolvedMaxLength);

    chain
      .setSiguiente(new ContentValidator(resolvedForbiddenWords))
      .setSiguiente(new MediaValidator());

    if (permissionRepo) {
      chain.setSiguiente(new PermissionValidator(permissionRepo));
    }

    if (adminResolver) {
      chain.setSiguiente(new MentionResolver(adminResolver));
    }

    return chain;
  }
}

function resolveMaxLength(explicit?: number): number {
  if (Number.isInteger(explicit) && explicit! > 0) {
    return explicit!;
  }

  const envRaw = process.env.MAX_MESSAGE_LENGTH;
  const envValue = envRaw ? Number(envRaw) : undefined;
  if (Number.isInteger(envValue) && envValue! > 0) {
    return envValue!;
  }

  return 5000;
}

function resolveForbiddenWords(explicit?: string[]): string[] {
  const envRaw = process.env.FORBIDDEN_WORDS;
  if (envRaw !== undefined) {
    return envRaw
      .split(",")
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
  }

  if (explicit && explicit.length > 0) {
    return explicit;
  }

  return ["violencia", "spam"];
}