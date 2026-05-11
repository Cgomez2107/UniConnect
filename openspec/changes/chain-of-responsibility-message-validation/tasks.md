## Bloque 1: Interfaz y Clase Abstracta

- [ ] 1.1 Crear `domain/validation/IMessageValidatorHandler.ts` con interfaces `ValidationResult` (`isValid`, `errorCode?`), `ValidatableMessage` y `IMessageValidatorHandler` (`setNext`, `handle`)
- [ ] 1.2 Crear `domain/validation/BaseMessageHandler.ts` como clase abstracta que implementa `IMessageValidatorHandler` con Template Method:
  - `handle()` ejecuta `doValidate()`, si falla retorna error, si pasa delega al siguiente
  - `setNext()` fluent: retorna el handler para encadenamiento
  - Métodos abstractos: `doValidate()` y `getErrorCode()`
- [ ] 1.3 Crear `domain/validation/ValidationError.ts` — error tipado con `code` para HTTP 400
- [ ] 1.4 Crear `domain/validation/index.ts` — barrel exports

## Bloque 2: Implementación de los 4 Handlers Concretos

- [ ] 2.1 Crear `domain/validation/SizeValidator.ts`:
  - Extiende `BaseMessageHandler`
  - `MAX_LENGTH = 500`
  - `doValidate()`: si `content.length > 500` → `{ isValid: false, errorCode: "SIZE_EXCEEDED" }`
  - `getErrorCode()`: `"SIZE_EXCEEDED"`
- [ ] 2.2 Crear `domain/validation/ContentValidator.ts`:
  - Extiende `BaseMessageHandler`
  - Recibe `IBannedWordList` por constructor
  - `doValidate()`: consulta `bannedWordList.containsBannedWord(content)` → si hay match, error `"CONTENT_BLOCKED"`
  - `getErrorCode()`: `"CONTENT_BLOCKED"`
- [ ] 2.3 Crear `domain/validation/MentionsValidator.ts`:
  - Extiende `BaseMessageHandler`
  - Recibe `IUserExistenceService` por constructor
  - `doValidate()`: si `mentionedUserIds` no está vacío, consulta `allUsersExist()` → si alguno no existe, error `"MENTION_NOT_FOUND"`
  - `getErrorCode()`: `"MENTION_NOT_FOUND"`
- [ ] 2.4 Crear `domain/validation/PermissionsValidator.ts`:
  - Extiende `BaseMessageHandler`
  - Recibe `IChatPermissionService` por constructor
  - `doValidate()`: primero verifica `isUserBanned()` → error `"USER_BANNED"`, luego `canWrite()` → error `"NO_WRITE_PERMISSION"`
  - `getErrorCode()`: retorna `"USER_BANNED_OR_NO_PERMISSION"` (genérico para logging)
- [ ] 2.5 Crear interfaces de servicios en `domain/validation/services/`:
  - `IBannedWordList.ts`: método `containsBannedWord(text: string): Promise<boolean>`
  - `IUserExistenceService.ts`: método `allUsersExist(userIds: string[]): Promise<boolean>`
  - `IChatPermissionService.ts`: métodos `isUserBanned(userId, conversationId)` y `canWrite(userId, conversationId)`
- [ ] 2.6 Verificar que cada handler implementa correctamente `doValidate()` y `getErrorCode()`

## Bloque 3: ValidatorFactory / Composition Root

- [ ] 3.1 Crear `domain/validation/ValidatorFactory.ts`:
  - Método estático `createChain(bannedWordList, userExistenceService, chatPermissionService): IMessageValidatorHandler`
  - Construye la cadena en orden: `SizeValidator → ContentValidator → MentionsValidator → PermissionsValidator`
  - Usa `setNext()` fluent para encadenar
  - Retorna la cabeza de la cadena (primer handler)
- [ ] 3.2 Verificar en `main.ts` que `ValidatorFactory.createChain()` se invoca con las implementaciones concretas de los servicios
- [ ] 3.3 Verificar que el orden de la cadena es explícito y visible en `ValidatorFactory` (cambiar el orden allí cambia la ejecución)

## Bloque 4: Integración en SendMessage y Tests

- [ ] 4.1 Modificar `SendMessage.ts`:
  - Agregar `validatorChain: IMessageValidatorHandler` al constructor
  - En `execute()`, construir `ValidatableMessage` y llamar `this.validatorChain.handle(validatable)` ANTES de persistir
  - Si `!validation.isValid`, lanzar `ValidationError(validation.errorCode!)`
  - Reutilizar `extractMentionsFromContent` de `mentionParser.ts` para poblar `mentionedUserIds`
- [ ] 4.2 Actualizar `main.ts`:
  - Instanciar servicios mock/real para `IBannedWordList`, `IUserExistenceService`, `IChatPermissionService`
  - Crear cadena con `ValidatorFactory.createChain(...)`
  - Pasar la cadena al constructor de `SendMessage`
- [ ] 4.3 Tests unitarios por handler:
  - `SizeValidator.test.ts`: mensaje de 501 chars falla, 500 chars pasa
  - `ContentValidator.test.ts`: contenido con "spam" falla, contenido limpio pasa
  - `MentionsValidator.test.ts`: mención a usuario inexistente falla, todas existentes pasan, sin menciones pasa
  - `PermissionsValidator.test.ts`: usuario baneado falla con `"USER_BANNED"`, sin permiso falla con `"NO_WRITE_PERMISSION"`, todo OK pasa
- [ ] 4.4 Test de integración de la cadena:
  - Construir cadena completa con `ValidatorFactory.createChain()` usando mocks
  - Enviar mensaje válido → verifica `{ isValid: true }`
  - Enviar mensaje con exceso de tamaño → verifica `{ isValid: false, errorCode: "SIZE_EXCEEDED" }}` y que ningún handler posterior se ejecuta
  - Enviar mensaje con palabra prohibida → verifica cortocircuito en `ContentValidator`
  - Enviar mensaje con mención inexistente → verifica cortocircuito en `MentionsValidator`
  - Enviar mensaje con usuario baneado → verifica cortocircuito en `PermissionsValidator`
- [ ] 4.5 Verificar Open/Closed:
  - Crear `AttachmentValidator` mock que extiende `BaseMessageHandler`
  - Agregarlo a la cadena en `ValidatorFactory`
  - Verificar que los 4 handlers originales funcionan igual
- [ ] 4.6 Ejecutar `npx tsx --test` sobre todos los tests de validation
- [ ] 4.7 Ejecutar `npx tsc --noEmit` para verificar tipos
