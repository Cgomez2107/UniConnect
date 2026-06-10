import { BaseValidator } from "./BaseValidator";
import { SizeValidator } from "./SizeValidator";
import { ContentValidator } from "./ContentValidator";
import { MentionValidator } from "./MentionValidator";
import { PermissionValidator } from "./PermissionValidator";
import type { IGroupPermissionRepository } from "./PermissionValidator";

export class ValidationChainFactory {
  static createChain(
    maxLength?: number,
    forbiddenWords?: string[],
    maxMentions?: number,
    permissionRepo?: IGroupPermissionRepository,
  ): BaseValidator {
    const head: BaseValidator = new SizeValidator(maxLength ?? 1000);
    let current: BaseValidator = head;

    current = current.setNext(new ContentValidator(forbiddenWords)) as BaseValidator;
    current = current.setNext(new MentionValidator(maxMentions ?? 10)) as BaseValidator;

    if (permissionRepo) {
      current = current.setNext(new PermissionValidator(permissionRepo)) as BaseValidator;
    }

    return head;
  }
}
