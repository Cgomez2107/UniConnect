import type { IMessageValidatorHandler } from "./IMessageValidatorHandler.js";
import type { IBannedWordList } from "./services/IBannedWordList.js";
import type { IUserExistenceService } from "./services/IUserExistenceService.js";
import type { IChatPermissionService } from "./services/IChatPermissionService.js";
import { SizeValidator } from "./SizeValidator.js";
import { ContentValidator } from "./ContentValidator.js";
import { MentionsValidator } from "./MentionsValidator.js";
import { PermissionsValidator } from "./PermissionsValidator.js";

export class ValidatorFactory {
  static createChain(
    bannedWordList: IBannedWordList,
    userExistenceService: IUserExistenceService,
    chatPermissionService: IChatPermissionService,
  ): IMessageValidatorHandler {
    const size = new SizeValidator();
    const content = new ContentValidator(bannedWordList);
    const mentions = new MentionsValidator(userExistenceService);
    const permissions = new PermissionsValidator(chatPermissionService);

    size.setNext(content)
        .setNext(mentions)
        .setNext(permissions);

    return size;
  }
}
