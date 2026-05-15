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
    let head: MessageValidator = new SizeValidator(maxLength);
    let current = head;

    current = current.setNext(new ContentValidator(forbiddenWords));
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
