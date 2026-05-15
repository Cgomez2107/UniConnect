# CH01 — Chain of Responsibility: Validación de Mensajes

## Diagrama UML

```mermaid
classDiagram
    class MessageValidator {
        # next: MessageValidator
        + setNext(validator) MessageValidator
        + setSiguiente(handler) MessageValidator
        + validate(content, metadata) Promise~void~
        + manejar(mensaje, metadata) Promise~ResultadoValidacion~
        # executeNext(content, metadata) Promise~void~
    }
    <<abstract>> MessageValidator

    class SizeValidator {
        - maxLength: number
        + validate(content, metadata) Promise~void~
    }

    class ContentValidator {
        - forbiddenPatterns: RegExp[]
        + validate(content, metadata) Promise~void~
    }

    class MediaValidator {
        + validate(content, metadata) Promise~void~
    }

    class PermissionValidator {
        - permissionRepo: IGroupPermissionRepository
        + validate(content, metadata) Promise~void~
    }

    class MentionResolver {
        - adminResolver: IAdminResolver
        + validate(content, metadata) Promise~void~
    }

    class ValidatorFactory {
        + createChain(maxLength, forbiddenWords, permissionRepo, adminResolver) MessageValidator
    }

    class ResultadoValidacion {
        + valido: boolean
        + codigoError?: string
        + mensajeError?: string
    }

    MessageValidator <|-- SizeValidator
    MessageValidator <|-- ContentValidator
    MessageValidator <|-- MediaValidator
    MessageValidator <|-- PermissionValidator
    MessageValidator <|-- MentionResolver
    MessageValidator --> ResultadoValidacion : manejar retorna
    ValidatorFactory --> MessageValidator : crea cadena
    PermissionValidator --> IGroupPermissionRepository
    MentionResolver --> IAdminResolver
```

## Diagrama de Secuencia

### Caso exitoso

```mermaid
sequenceDiagram
    actor Usuario
    participant Cliente as SendMessage / CreateStudyGroupMessage
    participant SZ as SizeValidator
    participant CV as ContentValidator
    participant MV as MediaValidator
    participant PV as PermissionValidator
    participant MR as MentionResolver
    participant CS as ChatSubject

    Usuario->>Cliente: enviarMensaje(texto, metadata)
    Cliente->>SZ: manejar(mensaje, metadata)

    SZ->>SZ: validar longitud
    Note over SZ: OK
    SZ->>CV: executeNext (validate)

    CV->>CV: validar palabras prohibidas
    Note over CV: OK
    CV->>MV: executeNext (validate)

    MV->>MV: validar tipo media
    Note over MV: OK
    MV->>PV: executeNext (validate)

    PV->>PV: validar permisos
    Note over PV: OK
    PV->>MR: executeNext (validate)

    MR->>MR: resolver @admin
    Note over MR: OK
    MR-->>Cliente: ok (void)

    Cliente->>CS: notificar(mensaje decorado)
    CS-->>Usuario: mensaje publicado
```

### Caso con cortocircuito (fallo en ContentValidator)

```mermaid
sequenceDiagram
    actor Usuario
    participant Cliente as SendMessage
    participant SZ as SizeValidator
    participant CV as ContentValidator

    Usuario->>Cliente: enviarMensaje("compra spam", metadata)
    Cliente->>SZ: manejar(mensaje, metadata)

    SZ->>SZ: validar longitud
    Note over SZ: OK
    SZ->>CV: executeNext (validate)

    CV->>CV: validar palabras prohibidas
    Note over CV: FALLA - detecta "spam"
    CV-->>Cliente: lanza ContentError

    Cliente->>Cliente: manejar() captura el error
    Note over Cliente: retorna ResultadoValidacion{ valido: false, codigoError: "ContentError", mensajeError: "..." }

    Cliente-->>Usuario: error: mensaje rechazado
```

## Estructura de Archivos

```
backend/shared/patterns/chain/message/
├── MessageValidator.ts        # Clase abstracta base
├── SizeValidator.ts           # Valida longitud del mensaje
├── ContentValidator.ts        # Filtra palabras prohibidas
├── MediaValidator.ts          # Valida tipo de archivo adjunto
├── PermissionValidator.ts     # Verifica permisos en grupos
├── MentionResolver.ts         # Resuelve menciones @admin
├── ValidatorFactory.ts        # Punto único de composición
├── ResultadoValidacion.ts     # Tipo de retorno de manejar()
├── index.ts                   # Barril de exportaciones
├── README.md                  # Este archivo
└── __tests__/
    └── validators.test.ts     # Tests unitarios
```
