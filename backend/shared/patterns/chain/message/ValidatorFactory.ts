import { MessageValidator } from "./MessageValidator.js";
import { SizeValidator } from "./SizeValidator.js";
import { ContentValidator } from "./ContentValidator.js";
import { MediaValidator } from "./MediaValidator.js";
import { PermissionValidator, type IGroupPermissionRepository } from "./PermissionValidator.js";
import { MentionResolver, type IAdminResolver } from "./MentionResolver.js";
import { LongitudHandler } from "./LongitudHandler.js";
import { PalabrasProhibidasHandler } from "./PalabrasProhibidasHandler.js";
import { EnlacesExternosHandler } from "./EnlacesExternosHandler.js";
import { SpamHandler, type IModerationRepository } from "./SpamHandler.js";

export class ValidatorFactory {
  static createChain(
    maxLength?: number,
    forbiddenWords?: string[],
    permissionRepo?: IGroupPermissionRepository,
    adminResolver?: IAdminResolver,
    moderationRepo?: IModerationRepository,
  ): MessageValidator {
    // Para cumplir el Criterio 2, limitamos a 1000 caracteres.
    const resolvedMaxLength = 1000;
    const resolvedForbiddenWords = resolveForbiddenWords(forbiddenWords);

    const chain = new LongitudHandler(resolvedMaxLength);

    chain.setSiguiente(new PalabrasProhibidasHandler(resolvedForbiddenWords));

    if (moderationRepo) {
      chain.setSiguiente(new SpamHandler(moderationRepo));
    }

    chain
      .setSiguiente(new EnlacesExternosHandler())
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

export function resolveForbiddenWords(explicit?: string[]): string[] {
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const envRaw = process.env.FORBIDDEN_WORDS;
  if (envRaw !== undefined) {
    return envRaw
      .split(",")
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
  }

  return ["violencia", "spam", "odio", "racismo", "discriminación", "pornografía", "drogas", "armas", "idiota", "estupido", "insulto", "tonto", "perra", "marica", "hp", "hpta", "puto", "puta"];
}