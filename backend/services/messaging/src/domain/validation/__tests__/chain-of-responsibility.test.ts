import { SizeValidator } from "../SizeValidator.js";
import { ContentValidator } from "../ContentValidator.js";
import { MentionsValidator } from "../MentionsValidator.js";
import { PermissionsValidator } from "../PermissionsValidator.js";
import { ValidatorFactory } from "../ValidatorFactory.js";
import type { IMessageValidatorHandler, ValidatableMessage, ValidationResult } from "../IMessageValidatorHandler.js";
import type { IBannedWordList } from "../services/IBannedWordList.js";
import type { IUserExistenceService } from "../services/IUserExistenceService.js";
import type { IChatPermissionService } from "../services/IChatPermissionService.js";
import { BaseMessageHandler } from "../BaseMessageHandler.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

function assertResult(
  result: ValidationResult,
  expectedIsValid: boolean,
  expectedErrorCode?: string,
  label?: string,
): void {
  const name = label ?? `handle() → { isValid: ${expectedIsValid}${expectedErrorCode ? `, errorCode: "${expectedErrorCode}"` : ""} }`;
  assert(result.isValid === expectedIsValid, name);
  if (expectedErrorCode !== undefined) {
    assert(result.errorCode === expectedErrorCode, `  errorCode es "${expectedErrorCode}" (obtenido: "${result.errorCode}")`);
  }
}

// ============================================================
// 1. SizeValidator
// ============================================================
console.log("\n🧪 SizeValidator");
console.log("-".repeat(60));

{
  const handler = new SizeValidator();

  const shortMsg: ValidatableMessage = {
    content: "a".repeat(500),
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  const shortResult = await handler.handle(shortMsg);
  assertResult(shortResult, true, undefined, "mensaje de 500 chars es válido");

  const longMsg: ValidatableMessage = {
    content: "a".repeat(501),
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  const longResult = await handler.handle(longMsg);
  assertResult(longResult, false, "SIZE_EXCEEDED", "mensaje de 501 chars es inválido");
}

// ============================================================
// 2. ContentValidator
// ============================================================
console.log("\n🧪 ContentValidator");
console.log("-".repeat(60));

{
  const mockBanned: IBannedWordList = {
    async containsBannedWord(text: string): Promise<boolean> {
      return text.toLowerCase().includes("spam");
    },
  };
  const handler = new ContentValidator(mockBanned);

  const cleanMsg: ValidatableMessage = {
    content: "Hola, ¿cómo estás?",
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  assertResult(await handler.handle(cleanMsg), true, undefined, "contenido limpio es válido");

  const spamMsg: ValidatableMessage = {
    content: "Compra ahora! spam",
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  assertResult(await handler.handle(spamMsg), false, "INVALID_CONTENT", "contenido con spam es inválido");
}

// ============================================================
// 3. MentionsValidator
// ============================================================
console.log("\n🧪 MentionsValidator");
console.log("-".repeat(60));

{
  let existingUsers: string[] = [];
  const mockUserService: IUserExistenceService = {
    async allUsersExist(userIds: string[]): Promise<boolean> {
      return userIds.every(id => existingUsers.includes(id));
    },
  };
  const handler = new MentionsValidator(mockUserService);

  existingUsers = ["user-abc", "user-def"];

  const noMentions: ValidatableMessage = {
    content: "Hola",
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  assertResult(await handler.handle(noMentions), true, undefined, "sin menciones es válido");

  const allValidMentions: ValidatableMessage = {
    content: "Hola @user-abc",
    senderId: "user-1",
    mentionedUserIds: ["user-abc"],
    conversationId: "conv-1",
    metadata: {},
  };
  assertResult(await handler.handle(allValidMentions), true, undefined, "menciones existentes es válido");

  const invalidMention: ValidatableMessage = {
    content: "Hola @unknown",
    senderId: "user-1",
    mentionedUserIds: ["user-unknown"],
    conversationId: "conv-1",
    metadata: {},
  };
  assertResult(await handler.handle(invalidMention), false, "USER_NOT_FOUND", "mención inexistente es inválido");
}

// ============================================================
// 4. PermissionsValidator
// ============================================================
console.log("\n🧪 PermissionsValidator");
console.log("-".repeat(60));

{
  let banned = false;
  let writeAllowed = true;
  const mockPermService: IChatPermissionService = {
    async isUserBanned(): Promise<boolean> { return banned; },
    async canWrite(): Promise<boolean> { return writeAllowed; },
  };
  const handler = new PermissionsValidator(mockPermService);

  const msg: ValidatableMessage = {
    content: "Hola",
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };

  banned = false; writeAllowed = true;
  assertResult(await handler.handle(msg), true, undefined, "usuario con permisos es válido");

  banned = true; writeAllowed = true;
  assertResult(await handler.handle(msg), false, "USER_BANNED", "usuario baneado es inválido");

  banned = false; writeAllowed = false;
  assertResult(await handler.handle(msg), false, "NO_WRITE_PERMISSION", "usuario sin permiso escritura es inválido");
}

// ============================================================
// 5. Integración — Cadena completa
// ============================================================
console.log("\n🧪 Integración — Cadena completa");
console.log("-".repeat(60));

{
  let bannedUsers: string[] = [];
  let allowedWriters: string[] = [];
  const mockBannedList: IBannedWordList = {
    async containsBannedWord(text: string): Promise<boolean> {
      return text.toLowerCase().includes("spam");
    },
  };
  const mockUserService: IUserExistenceService = {
    async allUsersExist(userIds: string[]): Promise<boolean> {
      return userIds.every(id => id.startsWith("existing-"));
    },
  };
  const mockPermService: IChatPermissionService = {
    async isUserBanned(userId: string): Promise<boolean> { return bannedUsers.includes(userId); },
    async canWrite(userId: string): Promise<boolean> { return allowedWriters.includes(userId); },
  };

  const chain = ValidatorFactory.createChain(mockBannedList, mockUserService, mockPermService);

  // Reset
  bannedUsers = [];
  allowedWriters = ["user-ok"];

  const validMsg: ValidatableMessage = {
    content: "Hola a todos",
    senderId: "user-ok",
    mentionedUserIds: ["existing-user-1"],
    conversationId: "conv-1",
    metadata: {},
  };
  const validResult = await chain.handle(validMsg);
  assertResult(validResult, true, undefined, "5a. mensaje válido pasa toda la cadena");

  const oversizedMsg: ValidatableMessage = {
    content: "a".repeat(501),
    senderId: "user-ok",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  const oversizedResult = await chain.handle(oversizedMsg);
  assertResult(oversizedResult, false, "SIZE_EXCEEDED", "5b. mensaje >500 chars falla con SIZE_EXCEEDED");

  const spamMsg: ValidatableMessage = {
    content: "Esto es spam",
    senderId: "user-ok",
    mentionedUserIds: ["existing-user-1"],
    conversationId: "conv-1",
    metadata: {},
  };
  const spamResult = await chain.handle(spamMsg);
  assertResult(spamResult, false, "INVALID_CONTENT", "5c. mensaje con spam falla con INVALID_CONTENT");

  const badMentionMsg: ValidatableMessage = {
    content: "Hola @ghost",
    senderId: "user-ok",
    mentionedUserIds: ["ghost"],
    conversationId: "conv-1",
    metadata: {},
  };
  const badMentionResult = await chain.handle(badMentionMsg);
  assertResult(badMentionResult, false, "USER_NOT_FOUND", "5d. mención inexistente falla con USER_NOT_FOUND");

  const bannedMsg: ValidatableMessage = {
    content: "Hola",
    senderId: "user-banned",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  bannedUsers = ["user-banned"];
  const bannedResult = await chain.handle(bannedMsg);
  assertResult(bannedResult, false, "USER_BANNED", "5e. usuario baneado falla con USER_BANNED");

  const noWriteMsg: ValidatableMessage = {
    content: "Hola",
    senderId: "user-readonly",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  bannedUsers = [];
  allowedWriters = ["user-ok"];
  const noWriteResult = await chain.handle(noWriteMsg);
  assertResult(noWriteResult, false, "NO_WRITE_PERMISSION", "5f. usuario sin permiso falla con NO_WRITE_PERMISSION");
}

// ============================================================
// 6. Validación de cortocircuito
// ============================================================
console.log("\n🧪 Cortocircuito — handlers posteriores no se ejecutan");
console.log("-".repeat(60));

{
  let sizeCalled = false;
  let contentCalled = false;
  let mentionsCalled = false;
  let permissionsCalled = false;

  class TrackerSize extends SizeValidator {
    protected override async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
      sizeCalled = true;
      return super.doValidate(message);
    }
  }

  class TrackerContent extends ContentValidator {
    protected override async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
      contentCalled = true;
      return super.doValidate(message);
    }
  }

  class TrackerMentions extends MentionsValidator {
    protected override async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
      mentionsCalled = true;
      return super.doValidate(message);
    }
  }

  class TrackerPermissions extends PermissionsValidator {
    protected override async doValidate(message: ValidatableMessage): Promise<ValidationResult> {
      permissionsCalled = true;
      return super.doValidate(message);
    }
  }

  const mockBanned: IBannedWordList = {
    async containsBannedWord(text: string): Promise<boolean> { return text.includes("spam"); },
  };
  const mockUserSvc: IUserExistenceService = {
    async allUsersExist(): Promise<boolean> { return true; },
  };
  const mockPermSvc: IChatPermissionService = {
    async isUserBanned(): Promise<boolean> { return false; },
    async canWrite(): Promise<boolean> { return true; },
  };

  const size = new TrackerSize();
  const content = new TrackerContent(mockBanned);
  const mentions = new TrackerMentions(mockUserSvc);
  const permissions = new TrackerPermissions(mockPermSvc);
  size.setNext(content).setNext(mentions).setNext(permissions);

  const spamMsg: ValidatableMessage = {
    content: "Esto es spam",
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  await size.handle(spamMsg);

  assert(sizeCalled, "6a. SizeValidator se ejecutó");
  assert(contentCalled, "6b. ContentValidator se ejecutó");
  assert(!mentionsCalled, "6c. MentionsValidator NO se ejecutó (cortocircuito)");
  assert(!permissionsCalled, "6d. PermissionsValidator NO se ejecutó (cortocircuito)");
}

// ============================================================
// 7. Principio Open/Closed — nuevo handler
// ============================================================
console.log("\n🧪 Open/Closed — nuevo AttachmentValidator");
console.log("-".repeat(60));

{
  class AttachmentValidator extends BaseMessageHandler {
    protected getErrorCode(): string { return "ATTACHMENT_TOO_LARGE"; }
    protected async doValidate(_message: ValidatableMessage): Promise<ValidationResult> {
      return { isValid: true }; // Siempre pasa en este test
    }
  }

  // Solo se modifica la composición, ningún handler existente cambia
  const mockBanned: IBannedWordList = {
    async containsBannedWord(): Promise<boolean> { return false; },
  };
  const mockUserSvc: IUserExistenceService = {
    async allUsersExist(): Promise<boolean> { return true; },
  };
  const mockPermSvc: IChatPermissionService = {
    async isUserBanned(): Promise<boolean> { return false; },
    async canWrite(): Promise<boolean> { return true; },
  };

  const size = new SizeValidator();
  const content = new ContentValidator(mockBanned);
  const mentions = new MentionsValidator(mockUserSvc);
  const permissions = new PermissionsValidator(mockPermSvc);
  const attachment = new AttachmentValidator();

  size.setNext(content).setNext(mentions).setNext(permissions).setNext(attachment);

  const msg: ValidatableMessage = {
    content: "Hola",
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  const result = await size.handle(msg);
  assertResult(result, true, undefined, "7. cadena con AttachmentValidator funciona correctamente");
}

// ============================================================
// 8. ValidatorFactory devuelve cabeza de cadena
// ============================================================
console.log("\n🧪 ValidatorFactory");
console.log("-".repeat(60));

{
  const mockBanned: IBannedWordList = {
    async containsBannedWord(): Promise<boolean> { return false; },
  };
  const mockUserSvc: IUserExistenceService = {
    async allUsersExist(): Promise<boolean> { return true; },
  };
  const mockPermSvc: IChatPermissionService = {
    async isUserBanned(): Promise<boolean> { return false; },
    async canWrite(): Promise<boolean> { return true; },
  };

  const chain = ValidatorFactory.createChain(mockBanned, mockUserSvc, mockPermSvc);

  assert(chain instanceof SizeValidator, "8a. createChain retorna SizeValidator (cabeza)");

  const msg: ValidatableMessage = {
    content: "Hola mundo",
    senderId: "user-1",
    mentionedUserIds: [],
    conversationId: "conv-1",
    metadata: {},
  };
  const result = await chain.handle(msg);
  assertResult(result, true, undefined, "8b. cadena de factory procesa mensaje válido correctamente");
}

// ============================================================
// Resumen
// ============================================================
console.log("\n" + "=".repeat(60));
console.log(`RESUMEN: ${passed} pasaron, ${failed} fallaron`);
console.log("=".repeat(60));

if (failed > 0) {
  console.error(`\n❌ ${failed} prueba(s) fallaron`);
  process.exit(1);
} else {
  console.log("\n✅ TODAS LAS PRUEBAS PASARON");
}
