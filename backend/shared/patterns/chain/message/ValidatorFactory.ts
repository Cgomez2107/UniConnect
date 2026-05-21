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

    let head: MessageValidator = new SizeValidator(resolvedMaxLength);
    let current = head;

    current = current.setNext(new ContentValidator(resolvedForbiddenWords));
    current = current.setNext(new MediaValidator());

    if (permissionRepo) {
      current = current.setNext(new PermissionValidator(permissionRepo));
    }

    if (adminResolver) {
      current = current.setNext(new MentionResolver(adminResolver));
    }

    return head;
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
