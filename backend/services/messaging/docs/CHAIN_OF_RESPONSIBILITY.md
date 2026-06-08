# Chain of Responsibility - Validación de Mensajes (US-CH01)

## Descripción

Este documento describe la implementación del patrón **Chain of Responsibility** para la validación de mensajes en UniConnect. El patrón permite que múltiples validadores actúen sobre un mensaje de forma secuencial, donde cada validador puede:

1. **Aceptar** el mensaje y pasar al siguiente validador
2. **Rechazar** el mensaje cortando la cadena y retornando un error
3. **Advertir** sin bloquear, informando al usuario de posibles problemas

---

## Componentes del Patrón

### Backend (Node.js)

#### Interfaz Base: `MessageValidator`

```typescript
export abstract class MessageValidator {
  protected next: MessageValidator | null = null;

  setNext(validator: MessageValidator): MessageValidator {
    this.next = validator;
    return validator; // Permite encadenamiento fluido
  }

  abstract validate(
    content: string,
    metadata?: ValidationMetadata
  ): Promise<void>;

  protected async executeNext(
    content: string,
    metadata?: ValidationMetadata
  ): Promise<void> {
    if (this.next) {
      await this.next.validate(content, metadata);
    }
  }
}
```

#### Validadores Concretos

| Validador | Responsabilidad | Error | Orden |
|-----------|-----------------|-------|-------|
| **SizeValidator** | Validar longitud (0-5000 caracteres) | `MESSAGE_EMPTY` o `MESSAGE_TOO_LONG` | 1° |
| **ContentValidator** | Detectar palabras prohibidas/spam | `BANNED_CONTENT` | 2° |
| **MediaValidator** | Validar tipos de archivo MIME | `UNSUPPORTED_FILE_TYPE`, `FILE_TOO_LARGE` | 3° |
| **PermissionValidator** | Verificar permisos en grupo (opcional) | `INSUFFICIENT_PERMISSIONS` | 4° |
| **MentionResolver** | Resolver menciones @usuario (opcional) | `MENTION_NOT_FOUND` | 5° |

#### Factory: `ValidatorFactory`

```typescript
export class ValidatorFactory {
  static createChain(): MessageValidator {
    const sizeValidator = new SizeValidator();
    const contentValidator = new ContentValidator();
    const mediaValidator = new MediaValidator();

    sizeValidator
      .setNext(contentValidator)
      .setNext(mediaValidator);

    return sizeValidator; // Retorna el primer validador de la cadena
  }
}
```

#### Uso en Use Case

```typescript
export class SendMessage {
  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    // Crear cadena de validadores
    const validator = ValidatorFactory.createChain();

    // Ejecutar validación (lanza excepción si falla)
    await validator.validate(input.content, {
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      groupId: input.groupId,
    });

    // Si llegamos aquí, el mensaje es válido
    const message = await this.repository.createMessage({
      ...input,
      content: input.content.trim(),
    });

    // Enriquecer con decoradores
    const decorated = this.buildDecoratedPayload(message);

    // Emitir a través de WebSocket
    this.chatSubject.emit("message:created", decorated);

    return decorated;
  }
}
```

### Frontend (Web - VITE)

#### Hook: `useMessageValidation`

```typescript
const { validationState, validateMessage, clearValidation } =
  useMessageValidation({
    maxLength: 5000,
    debounceMs: 300,
    onValidationChange: (state) => {
      // Actualizar UI con validationState
    },
  });
```

**Estados de Validación**:

```typescript
interface ValidationState {
  isValidating: boolean; // Validación en progreso
  isValid: boolean; // ¿Mensaje válido?
  error?: {
    code: ValidationErrorCode; // Código de error estandarizado
    message: string; // Mensaje amigable para usuario
  };
  warnings?: ValidationWarning[]; // Advertencias (no bloquean)
  suggestions?: string[]; // Sugerencias para usuario
}
```

#### Componente: `MentionInput` Mejorado

```typescript
// Estado visual basado en validación
<input
  className={`border ${
    validationState.error
      ? "border-error-500"
      : "border-neutral-300"
  }`}
/>

// Mostrar error inline
{validationState.error && (
  <div className="bg-error-50 p-2 rounded">
    <p>⚠️ {validationState.error.message}</p>
  </div>
)}

// Contador de caracteres
<span>{text.length} / 5000</span>

// Botón deshabilitado si hay error
<button disabled={validationState.error !== undefined}>
  Enviar
</button>
```

### Frontend (Mobile - Expo/React Native)

#### Hook: `useMessageValidation` (RN)

Idéntico al de Web, pero adaptado para componentes RN:

```typescript
const { validationState } = useMessageValidation({
  maxLength: 5000,
});

return (
  <View style={styles.container}>
    {/* TextInput con estilos dinámicos */}
    <TextInput
      value={text}
      style={[
        styles.input,
        validationState.error && styles.inputError,
      ]}
    />

    {/* Error message */}
    {validationState.error && (
      <Text style={styles.errorText}>
        ⚠️ {validationState.error.message}
      </Text>
    )}

    {/* Character counter */}
    <Text style={styles.charCounter}>
      {text.length} / 5000
    </Text>
  </View>
);
```

---

## Diagrama UML

```
┌─────────────────────────────────────────────────────────────┐
│                    <<abstract>>                              │
│              MessageValidator                                │
├─────────────────────────────────────────────────────────────┤
│ - next: MessageValidator | null                             │
├─────────────────────────────────────────────────────────────┤
│ + setNext(validator): MessageValidator                       │
│ + abstract validate(content, metadata): Promise<void>        │
│ # executeNext(content, metadata): Promise<void>              │
└─────────────────────────────────────────────────────────────┘
                           △
                           │ extends
        ┌──────────────────┼──────────────────────────┬────────────────┐
        │                  │                          │                │
┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ SizeValidator │  │ContentValidator│  │MediaValidator│  │PermValidator │
├───────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ maxLength=5000│  │ forbiddenWords│  │ allowedMimes │  │ checkPerms() │
├───────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ + validate()  │  │ + validate()  │  │ + validate() │  │ + validate() │
└───────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

                    ┌──────────────────────┐
                    │  ValidatorFactory    │
                    ├──────────────────────┤
                    │ createChain(): Validator
                    └──────────────────────┘
```

---

## Diagrama de Secuencia - Caso Exitoso

```
Cliente              Gateway           SendMessage             Chain
  │                    │                  │                     │
  ├─ POST /messages ─→ │                  │                     │
  │  {content: "Hola"} │                  │                     │
  │                    │                  │                     │
  │                    ├─ validateContent ─→                     │
  │                    │                  │                     │
  │                    │                  ├─ SizeValidator ─→   │
  │                    │                  │  trim, length OK    │
  │                    │                  │                 ✓   │
  │                    │                  │ ← executeNext ────── │
  │                    │                  │                     │
  │                    │                  ├─ ContentValidator →  │
  │                    │                  │  no forbidden words  │
  │                    │                  │                 ✓   │
  │                    │                  │ ← executeNext ────── │
  │                    │                  │                     │
  │                    │                  ├─ MediaValidator ─→  │
  │                    │                  │  no attachment      │
  │                    │                  │                 ✓   │
  │                    │                  │ ← executeNext ────── │
  │                    │                  │                     │
  │                    │ ← ValidationOK ─ │                     │
  │                    │                  │                     │
  │                    │                  ├─ repository.create() │
  │                    │                  │   saveMessage()      │
  │                    │                  │ ← msgId: uuid        │
  │                    │                  │                     │
  │                    │                  ├─ buildDecorators()  │
  │                    │                  │ ← enriched msg       │
  │                    │                  │                     │
  │                    │                  ├─ ChatSubject.emit() │
  │                    │                  │ broadcast to WS     │
  │                    │                  │                     │
  │ ← 201 Created ─── │ ← 201 Created ── │                     │
  │  {id, content}    │                  │                     │
  │                    │                  │                     │
```

---

## Diagrama de Secuencia - Caso con Error

```
Cliente              Gateway           SendMessage             Chain
  │                    │                  │                     │
  ├─ POST /messages ─→ │                  │                     │
  │  {content: "X"*6000}                  │                     │
  │  (6000 caracteres)  │                  │                     │
  │                    │                  │                     │
  │                    ├─ validateContent ─→                     │
  │                    │                  │                     │
  │                    │                  ├─ SizeValidator ─→   │
  │                    │                  │  length > 5000      │
  │                    │                  │  throw SizeError    │
  │                    │                  │                 ✗   │
  │                    │                  │ ← throw SizeError    │
  │                    │                  │                     │
  │                    │ ← ValidationError │                     │
  │                    │    SizeError      │                     │
  │                    │                  │                     │
  │                    ├─ ValidationErrorMapper.mapError()       │
  │                    │  code: MESSAGE_TOO_LONG                 │
  │                    │  message: "El mensaje es demasiado..."  │
  │                    │  statusCode: 400                        │
  │                    │                  │                     │
  │ ← 400 Bad Request  │                  │                     │
  │  {error: "MSG_LIMIT_EXCEEDED",        │                     │
  │   message: "..."}  │                  │                     │
  │                    │                  │                     │
```

---

## Códigos de Error Estandarizados

Todos los validadores lanzans excepciones que se mapean a estos códigos:

```typescript
export enum ValidationErrorCode {
  // Size
  MESSAGE_EMPTY = "MESSAGE_EMPTY",
  MESSAGE_TOO_LONG = "MESSAGE_TOO_LONG",

  // Content
  FORBIDDEN_WORDS = "FORBIDDEN_WORDS",
  BANNED_CONTENT = "BANNED_CONTENT",
  SPAM_DETECTED = "SPAM_DETECTED",

  // Media
  UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILENAME = "INVALID_FILENAME",

  // Permissions
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  USER_BANNED_FROM_GROUP = "USER_BANNED_FROM_GROUP",

  // Mentions
  INVALID_MENTION = "INVALID_MENTION",
  MENTION_NOT_FOUND = "MENTION_NOT_FOUND",
}
```

Cada código tiene un **mensaje amigable en español**:

```typescript
export const ValidationErrorMessages: Record<
  ValidationErrorCode,
  string
> = {
  [ValidationErrorCode.MESSAGE_TOO_LONG]:
    "El mensaje es demasiado largo. Máximo 1000 caracteres.",
  [ValidationErrorCode.BANNED_CONTENT]:
    "El contenido de tu mensaje no está permitido en este chat.",
  [ValidationErrorCode.UNSUPPORTED_FILE_TYPE]:
    "Este tipo de archivo no está soportado.",
  // ... más mensajes
};
```

---

## Flujo de Datos Completo

### 1. **Cliente (Web/Mobile) escribe mensaje**

```
TextInput onChange → validateMessage(content)
  ↓
  ├─ Validación síncrona (tamaño, palabras prohibidas)
  ├─ Validación asíncrona con debounce
  └─ setState(validationState)
    ↓
    ├─ Mostrar error si error !== null
    ├─ Mostrar advertencias
    └─ Deshabilitar botón Enviar si validationState.error
```

### 2. **Usuario hace clic en "Enviar"**

```
onClick(Enviar)
  ↓
  ├─ Validar nuevamente antes de enviar
  ├─ Si error, mostrar alerta y retornar
  └─ Si OK, enviar HTTP POST
    ↓
    POST /api/v1/messages
    Headers: { x-user-id, Content-Type }
    Body: { conversationId, content, mediaUrl?, mediaType? }
```

### 3. **Backend recibe y valida**

```
MessagingController.createMessage(req)
  ↓
  ├─ Zod validation (estructura JSON)
  ├─ Extraer actorUserId del JWT
  └─ SendMessage.execute(input)
    ↓
    ├─ ValidatorFactory.createChain()
    ├─ chain.validate(content, metadata)
    │  ├─ SizeValidator.validate() → SizeError si falla
    │  ├─ ContentValidator.validate() → ContentError si falla
    │  ├─ MediaValidator.validate() → MediaError si falla
    │  └─ PermissionValidator.validate() → PermissionError si falla
    │
    ├─ Si error: ValidationErrorMapper.mapError() → código estándar
    ├─ Si OK: repository.createMessage()
    ├─ buildDecoratedPayload() (agregar decoradores)
    └─ ChatSubject.emit() (broadcast WebSocket)
```

### 4. **Respuesta HTTP**

**Caso exitoso (200)**:
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "Hola mundo",
  "createdAt": "2026-05-19T10:30:00Z"
}
```

**Caso error (400-403)**:
```json
{
  "error": "MESSAGE_TOO_LONG",
  "message": "El mensaje es demasiado largo. Máximo 1000 caracteres.",
  "details": {
    "timestamp": "2026-05-19T10:30:00Z",
    "errorName": "SizeError"
  }
}
```

---

## Extensibilidad

### ✅ Agregar nuevo validador sin modificar existentes

```typescript
// 1. Crear nueva clase que extienda MessageValidator
export class ExemptUsersValidator extends MessageValidator {
  constructor(private exemptUserIds: string[]) {
    super();
  }

  async validate(
    content: string,
    metadata?: ValidationMetadata
  ): Promise<void> {
    if (this.exemptUserIds.includes(metadata?.userId || "")) {
      // Usuario exento, saltamos esta validación
      return this.executeNext(content, metadata);
    }

    // Lógica específica
    if (somethingWrong) {
      throw new ValidatorError(
        ValidationErrorCode.CUSTOM_ERROR,
        "Custom message"
      );
    }

    return this.executeNext(content, metadata);
  }
}

// 2. Modificar SOLO la factory
export class ValidatorFactory {
  static createChain(): MessageValidator {
    const sizeValidator = new SizeValidator();
    const contentValidator = new ContentValidator();
    const mediaValidator = new MediaValidator();
    const exemptValidator = new ExemptUsersValidator(["admin-id-123"]); // ← NUEVO

    sizeValidator
      .setNext(contentValidator)
      .setNext(mediaValidator)
      .setNext(exemptValidator); // ← NUEVO

    return sizeValidator;
  }
}
```

**Criterio de aceptación 6**: ✅ Solo modificamos la composición en `ValidatorFactory`, no los handlers existentes.

---

## Testing

### Unit Tests

```typescript
describe("SizeValidator", () => {
  it("should throw on empty message", async () => {
    const validator = new SizeValidator();
    await expect(validator.validate("")).rejects.toThrow(SizeError);
  });

  it("should throw on message > 5000 chars", async () => {
    const validator = new SizeValidator();
    const longMessage = "x".repeat(5001);
    await expect(validator.validate(longMessage)).rejects.toThrow();
  });

  it("should pass valid message to next validator", async () => {
    const mockNext = jest.fn();
    const validator = new SizeValidator();
    validator.next = mockNext;
    await validator.validate("valid message");
    expect(mockNext).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe("ValidatorChain Integration", () => {
  it("should validate successful message end-to-end", async () => {
    const chain = ValidatorFactory.createChain();
    const result = await chain.validate("Hello world", {
      mediaUrl: undefined,
    });
    expect(result).toBeUndefined(); // No error thrown
  });

  it("should stop at first error in chain", async () => {
    const chain = ValidatorFactory.createChain();
    const longMsg = "x".repeat(5001);
    await expect(chain.validate(longMsg)).rejects.toThrow(SizeError);
  });
});
```

---

## Consideraciones de Seguridad

1. **Validación duplicada**: Client-side para UX, Backend siempre.
2. **No confiar en cliente**: El servidor valida siempre.
3. **Rate limiting**: Usar en gateway para prevenir spam.
4. **Sanitización**: Limpiar input antes de guardar en BD.

---

## Referencias

- **Patrón Chain of Responsibility**: Gang of Four design pattern
- **Implementación backend**: `backend/shared/patterns/chain/message/`
- **Implementación frontend**: `web/src/hooks/useMessageValidation.ts`
- **Mobile (RN)**: `frontend/hooks/useMessageValidation.ts`

