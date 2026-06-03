# CH01 — Chain of Responsibility: Validación de Mensajes

## Diagrama UML

```mermaid
classDiagram
    class MessageValidator {
        # next: MessageValidator
        + setSiguiente(handler) this
        + manejar(mensaje, metadata) Promise~ResultadoValidacion~
        # validar(mensaje, metadata) Promise~ResultadoValidacion~
    }
    <<abstract>> MessageValidator

    class SizeValidator {
        - maxLength: number
        # validar(mensaje, metadata) Promise~ResultadoValidacion~
    }

    class ContentValidator {
        - forbiddenPatterns: RegExp[]
        # validar(mensaje, metadata) Promise~ResultadoValidacion~
    }

    class MediaValidator {
        # validar(mensaje, metadata) Promise~ResultadoValidacion~
    }

    class PermissionValidator {
        - permissionRepo: IGroupPermissionRepository
        # validar(mensaje, metadata) Promise~ResultadoValidacion~
    }

    class MentionResolver {
        - adminResolver: IAdminResolver
        # validar(mensaje, metadata) Promise~ResultadoValidacion~
    }

    class ValidatorFactory {
        + createChain(maxLength, forbiddenWords, permissionRepo, adminResolver) MessageValidator
    }

    class ResultadoValidacion {
        + valido: boolean
        + codigoError?: string
        + mensajeError?: string
        + contenidoModificado?: string
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
    Note over SZ: valido: true
    SZ->>CV: next.manejar(mensaje, metadata)

    CV->>CV: validar palabras prohibidas
    Note over CV: valido: true
    CV->>MV: next.manejar(mensaje, metadata)

    MV->>MV: validar tipo media
    Note over MV: valido: true
    MV->>PV: next.manejar(mensaje, metadata)

    PV->>PV: validar permisos
    Note over PV: valido: true
    PV->>MR: next.manejar(mensaje, metadata)

    MR->>MR: resolver @admin
    Note over MR: valido: true, contenidoModificado: "@userId"
    MR-->>SZ: ResultadoValidacion { valido: true }

    SZ-->>Cliente: ResultadoValidacion { valido: true }
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
    Note over SZ: valido: true
    SZ->>CV: next.manejar(mensaje, metadata)

    CV->>CV: validar palabras prohibidas
    Note over CV: valido: false — detecta "spam"
    CV-->>SZ: ResultadoValidacion { valido: false, codigoError: "ContentError" }
    SZ-->>Cliente: ResultadoValidacion { valido: false, codigoError: "ContentError", mensajeError: "..." }

    Cliente-->>Usuario: error: mensaje rechazado
```

## Principios del patrón

1. **Interfaz única**: Solo `manejar()` es público. Cada handler implementa `validar()` como método protegido que retorna `ResultadoValidacion`.

2. **Composición oculta**: `setSiguiente()` retorna `this` (no el siguiente handler), ocultando la estructura interna de la cadena.

3. **Cortocircuito**: Si `validar()` retorna `{ valido: false }`, la cadena se corta inmediatamente sin invocar al siguiente handler.

4. **Contenido modificado**: Los handlers pueden retornar `contenidoModificado` (ej: `MentionResolver` resuelve `@admin` → `@userId`), que se propaga al siguiente handler.

5. **Punto único de composición**: `ValidatorFactory.createChain()` es el único lugar donde se construye la cadena.

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
├── ValidationErrorHandler.ts  # Middleware para error handling
├── ValidationErrorMapper.ts   # Mapeo de errores a HTTP
├── index.ts                   # Barril de exportaciones
├── README.md                  # Este archivo
└── __tests__/
    └── validators.test.ts     # Tests unitarios
```