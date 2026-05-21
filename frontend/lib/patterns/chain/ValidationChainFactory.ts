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
    let head: BaseValidator = new SizeValidator(maxLength ?? 5000);
    let current = head;

    current = current.setNext(new ContentValidator(forbiddenWords));
    current = current.setNext(new MentionValidator(maxMentions ?? 10));

    if (permissionRepo) {
      current = current.setNext(new PermissionValidator(permissionRepo));
    }

    return head;
  }
}
