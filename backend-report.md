# Reporte Técnico: Backend UniConnect

> Generado el 2026-05-12 mediante exploración del código fuente.
> Actualizado: integración de patrones GoF con Supabase Realtime (Strategy, Chain of Responsibility, Decorator de notificaciones, Observer en messaging/events, State + realtime cross-service).

---

## 1. Arquitectura General: Híbrido Hexagonal + Microservicios con Event-Driven

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENTE (Web/App)                        │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼───────────────────────────────────┐
│                      GATEWAY (API Gateway)                    │
│  Proxy HTTP /health, /api/v1/auth, /api/v1/study-groups ...  │
│  JWT Auth Middleware (cookies + Bearer)                       │
│  Inyecta automáticamente JWT de cookies si falta header       │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬─────────────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
 auth  events messaging prof-  resour  study-
                        catalog ces    groups
(6 microservicios, todos con arquitectura hexagonal)
```

| Componente | Rol |
|---|---|
| **Gateway** | Punto único de entrada. Rutea por path, valida JWT, inyecta CORS |
| **auth** | Registro, login, refresh token, Google OAuth vía Supabase |
| **events** | Eventos académicos + suscripciones por categoría + Supabase Realtime |
| **messaging** | Mensajería, chats, decorators de mensajes, validación Chain of Resp. |
| **profiles-catalog** | Perfiles de estudiantes + catálogo de materias + decorators lazy |
| **resources** | Recursos académicos compartidos + almacenamiento de archivos |
| **study-groups** | Grupos de estudio (State Machine + Eventos + Decorators + Notificaciones) |

### Stack base

- **Runtime**: Node.js 20+, TypeScript 5.7+
- **Monorepo**: Turborepo 2.1 + pnpm 9.12
- **BD**: PostgreSQL vía Supabase (conexión pool con `pg`)
- **Tiempo real**: Supabase Realtime (broadcast) — canales `user-notifications:{userId}` y `event-notifications:{userId}`
- **Despliegue**: Docker → Fly.io, con manifiestos K8s disponibles
- **CI**: GitHub Actions (`infra/ci/backend-ci.yml`)
- **HTTP**: `node:http` nativo — sin Express, Fastify ni frameworks web

---

## 2. Estilo Arquitectónico: Hexagonal (Ports & Adapters)

Cada microservicio sigue consistentemente la misma estructura de 4 capas:

```
services/<name>/src/
  ├── config/              ← Config: load env vars
  ├── domain/              ← Núcleo del negocio
  │   ├── entities/        ← Entidades de dominio (readonly interfaces/objetos)
  │   ├── events/          ← Eventos de dominio (tipados) + Subjects/Observers
  │   ├── repositories/    ← Puertos (interfaces): I*Repository
  │   └── states/          ← Máquina de estados (solo study-groups)
  ├── application/         ← Casos de uso
  │   └── use-cases/       ← Orquestan lógica, inyectan repositorios + Subject
  ├── infrastructure/      ← Adaptadores concretos
  │   ├── database/        ← Repositorios Postgres + InMemory (dual)
  │   ├── realtime/        ← Supabase Realtime Gateway (messaging, study-groups, events)
  │   └── storage/         ← File handling (resources)
  ├── interfaces/          ← Adaptadores de entrada
  │   └── http/            ← Controladores, DTOs, rutas, middlewares
  ├── types/               ← Tipos compartidos del servicio
  └── main.ts              ← Composition Root (DI manual)
```

**Reglas de dependencia**: `interfaces` → `application` → `domain` ← `infrastructure`. El dominio nunca depende de nada externo.

### Excepción: auth es más plano

`auth` no tiene estados ni eventos de dominio. Sus controladores manejan directamente el request (menos estructura hexagonal pura, más pragmático).

---

## 3. Patrones de Diseño Implementados

### 3.1 Singleton — `shared/libs/`

| Clase | Propósito |
|---|---|
| `Logger` | Logger centralizado con niveles y colores ANSI |
| `DatabaseHandler` | Pool único de conexiones PostgreSQL |
| `EventBus` | Bus global de eventos de aplicación |

```typescript
// shared/libs/database/DatabaseHandler.ts
export class DatabaseHandler {
  private static instance: DatabaseHandler;
  public static getInstance(): DatabaseHandler { ... }
}
```

### 3.2 Factory Method — `shared/patterns/factory/`

`PublicationFactory` crea 4 tipos de publicaciones según `config.type`:

```
PublicationFactory.create({ type: 'busco_companero', ... })
  → StudyCompanionPublication
  → ProjectTeamPublication
  → ResourcePublication
  → EventPublication
```

Cada tipo encapsula su propia lógica y campos específicos. Agregar un nuevo tipo no requiere modificar el factory existente.

### 3.3 Decorator — Tres implementaciones

**a) Middleware chain** (`shared/patterns/decorator/`):

```
Middleware (abstracto)
  ├── AuthenticationMiddleware   ← Capa 1: validar JWT
  ├── EmailVerificationMiddleware ← Capa 2: validar email institucional
  └── SemesterCheckMiddleware    ← Capa 3: validar semestre activo
```

Apilables vía `MiddlewareChainBuilder` (fluent API). Cada capa decora el request con datos adicionales y pasa al siguiente.

**b) Message decorators** (`services/messaging/src/domain/decorators/`):

```
IMessage (interfaz)
  ├── BaseMessage               ← Componente base
  └── MessageDecorator (abstracto)
       ├── FileDecorator        ← Adjuntar archivos
       ├── MentionDecorator     ← Menciones @usuario
       └── ReactionDecorator    ← Reacciones emoji
```

**c) Notification decorators** (`shared/patterns/decorator/notification/`) — **NUEVO**:

```
INotification (interfaz)
  ├── BaseNotification          ← Componente base (mensaje, destinatario, timestamp)
  └── NotificationDecorator (abstracto)
       ├── PriorityDecorator    ← Añade nivel: normal | urgente | critica
       └── ActionDecorator      ← Añade acción navegable (label, endpoint)
```

Los decoradores de notificación están en `shared/patterns/` para ser consumidos por múltiples servicios (study-groups, messaging).

**Cadena típica:**
```typescript
let notif: INotification = new BaseNotification({ mensaje, destinatario, timestamp });
notif = new PriorityDecorator(notif, "urgente");
notif = new ActionDecorator(notif, { label: "Revisar", endpoint: "/api/v1/..." });
// notif.toJSON() → { mensaje, destinatario, timestamp, nivel: "urgente", accion: {...} }
```

### 3.4 Facade — `shared/patterns/facade/`

| Facade | Coordina |
|---|---|
| `RegistrationFacade` | `UserService` + `EmailService` + `ProfileService` + `ConfigService` |
| `StudyGroupFacade` | `GroupRepository` + `MembershipService` + `ConfigService` + `NotificationService` |

El controller llama un solo método; la facade orquesta internamente múltiples subsistemas.

### 3.5 Observer — Tres niveles

**Nivel global** (`shared/patterns/observer/`):

```
EventBus (Singleton)
  └── EventEmitter (abstracto)
       ├── subscribe(observer)
       ├── unsubscribe(observer)
       └── emit(event) → notifica a todos en paralelo (fail-safe)
```

Observadores: `AppNotificationObserver`, `EmailNotificationObserver`, `PendingCounterObserver`.

**Nivel de dominio — Study Groups** (`study-groups/src/domain/events/`):

```
StudyGroupSubject (implementa ISubject<StudyGroupEvent>)
  └── subscribe(IObserver<StudyGroupEvent>)
       ├── NotificationObserver              ← Persiste + decora (PriorityDecorator, ActionDecorator)
       └── WebSocketNotificationObserver     ← Broadcast por Supabase Realtime
```

Los `StudyGroupEvent` son **tipados y versionados** (`"1.0"`) con una unión discriminada de 5 eventos:
`SOLICITUD_INGRESO`, `MIEMBRO_ACEPTADO`, `MIEMBRO_RECHAZADO`, `TRANSFERENCIA_ADMIN_SOLICITADA`, `TRANSFERENCIA_ADMIN_ACEPTADA`.

**Nivel de dominio — Messaging** (`messaging/src/domain/events/`) — **NUEVO**:

```
ChatSubject (implementa ISubject<ChatEvent, ChatChannel>)
  └── subscribe(channel, IChatObserver)
       ├── RealtimeObserver              ← Broadcast del mensaje al canal del chat
       ├── IdempotencyObserver           ← Previene duplicados
       └── ChatNotificationObserver      ← Resuelve destinatario → NotificationService → Supabase
```

`ChatEvent` es unión discriminada de: `NUEVO_MENSAJE`, `MessageRead`, `UserTyping`.

**Nivel de dominio — Events** (`events/src/domain/events/`) — **NUEVO**:

```
UniversityEventSubject
  └── subscribe(IObserver)
       └── UniversityEventObserver       ← Filtra por categoría, emite por Supabase Realtime
```

**Principio de segregación de interfaz:** Los Subjects solo exponen `subscribe()`, `unsubscribe()` y `emit()` — sin métodos de gestión de canales.

### 3.6 State — `study-groups/src/domain/states/`

Máquina de estados del ciclo de vida de un grupo de estudio:

```
                  ┌───────────┐
                  │  Abierta  │
                  └─────┬─────┘
                   │     │     │
          members  │     │     │  solicita
          >= max   │     │     │  transferencia
                   │     │     ▼
              ┌────▼──┐  ┌──────────────────┐
              │ Llena │  │TransferenciaPend.│
              └───────┘  └──────────────────┘
              cerrada          │
                  │            │ acepta
                  ▼            ▼
              ┌───────────┐  ┌───────────┐
              │ Cerrada   │  │  Abierta  │ (restaurado)
              └───────────┘  └───────────┘
              expirada
                  │
                  ▼
              ┌───────────┐
              │ Expirada  │
              └───────────┘
```

Cada estado implementa `IStudyGroupState` y lanza `InvalidStateTransitionError` (extiende `DomainError`, HTTP 422) si la operación no es válida.

`TransferenciaPendienteState` almacena `previousState: IStateStrategy` para restauración exacta al aceptar o rechazar.

### 3.7 Strategy — `shared/patterns/strategy/` — **NUEVO**

Sistema multicanal de notificaciones. Cada canal es una estrategia intercambiable:

```
NotificationService
  └── notificar(NotificacionDTO) → ResumenNotificacion
       ├── Filtra estrategias según preferencias del usuario (IPreferenceService)
       ├── Ejecuta en paralelo (Promise.allSettled)
       └── Compila resumen con sanitizeError en fallos
```

Estrategias concretas:

| Estrategia | `canal` | Medio | Requiere |
|---|---|---|---|
| `InAppWebSocketStrategy` | `in_app_websocket` | Supabase Realtime broadcast | `IStudyGroupSocketGateway` |
| `EmailInstitucionalStrategy` | `email_institucional` | SendGrid (IEmailGateway) | `IUserRepository.getContactInfo()` |
| `PushMovilStrategy` | `push_movil` | Push notifications | `IUserRepository.getContactInfo()` |

Flujo completo:

```
Estado.applyToGroup()
  → StudyGroupSubject.emit(event)          ← Observer
  → NotificationObserver.handle(event)     ← Observer
  → NotificationMapper.map(event)          ← Decorator chain (Priority ± Action)
  → NotificationService.notificar(dto)     ← Strategy pattern
  → InAppWebSocketStrategy.enviar(dto)     ← Supabase Realtime broadcast
  → SupabaseRealtimeGateway.emitToUser()   ← Canal user-notifications:{userId}
```

### 3.8 Chain of Responsibility (CH01) — `shared/patterns/chain/message/` — **NUEVO**

Cadena de validación inmutable para mensajes de chat:

```
ValidatorFactory.createChain(maxLength)
  └── validate(content, metadata)
       ├── SizeValidator        ← Vacío? → SizeError("empty")
       │                           Largo? → SizeError("max_length", maxLength)
       ├── ContentValidator     ← Palabras prohibidas? → ContentError("forbidden_words")
       ├── MediaValidator       ← MIME no soportado? → MediaError("unsupported_type")
       │                           Filename largo? → MediaError("filename_too_long")
       └── (siguiente eslabón)
```

**Inmutabilidad:** ningún eslabón modifica `content`. Cada validador pasa el contenido sin cambios al siguiente.

Se usa en `SendMessage.execute()` antes de cualquier acceso a repositorio o emisión de evento.

### 3.9 Repository + Strategy (dual implementación)

Cada interfaz de repositorio tiene **dos implementaciones** intercambiables:

```
IStudyRequestRepository
  ├── PostgresStudyRequestRepository    ← Producción (Pool pg)
  └── InMemoryStudyRequestRepository    ← Tests / desarrollo local
```

El `main.ts` selecciona la implementación según disponibilidad de BD:

```typescript
function createRepository(env, pool) {
  if (pool) return new PostgresStudyRequestRepository(pool);
  return new InMemoryStudyRequestRepository();
}
```

**Nuevos repositorios:**
- `PostgresUserRepository` (`study-groups`) — `getContactInfo(userId)` → resuelve email/pushToken desde `profiles`

### 3.10 Dependency Injection Manual

No hay un contenedor DI. El `main.ts` de cada servicio es el **composition root**:

```typescript
// main.ts (messaging, simplificado):
const supabaseGateway = new SupabaseRealtimeGateway(url, key);
const emailStrategy = new EmailInstitucionalStrategy(emailGateway, userRepo);
const wsStrategy = new InAppWebSocketStrategy(supabaseGateway);
const pushStrategy = new PushMovilStrategy(pushGateway, userRepo);
const notifService = new NotificationService([wsStrategy, emailStrategy, pushStrategy], prefService);
const chatNotifObserver = new ChatNotificationObserver(notifService, userRepo);
const useCase = new SendMessage(repo, chatSubject, realtimeObserver, idempotencyObserver, chatNotifObserver);
```

### 3.11 Builder (EventBus)

```typescript
EventBus.builder()
  .addObserver(new AppNotificationObserver())
  .addObserver(new EmailNotificationObserver())
  .build();
```

---

## 4. Estándares de Nombrado

| Categoría | Convención | Ejemplo |
|---|---|---|
| **Archivos de clase** | PascalCase | `AbiertaState.ts`, `DatabaseHandler.ts` |
| **Archivos de utilidad** | camelCase | `sendJson.ts`, `requiredEnv.ts`, `mapHttpStatus.ts` |
| **Clases** | PascalCase | `StudyGroup`, `PostgresStudyRequestRepository` |
| **Interfaces** | Prefijo `I` | `IStudyGroupState`, `IStudyRequestRepository` |
| **Casos de uso** | Verbo + Sustantivo | `ApplyToStudyRequest`, `ReviewApplication` |
| **DTOs** | Sufijo `Dto` | `CreateStudyGroupDto`, `ReviewApplicationDto` |
| **Métodos/funciones** | camelCase | `getInstance()`, `loadStudyGroup()`, `mapStudyRequest()` |
| **Constantes/Enums** | UPPER_SNAKE_CASE | `LogLevel.INFO`, `LogLevel.ERROR` |
| **Eventos de dominio** | UPPER_SNAKE_CASE | `"SOLICITUD_INGRESO"`, `"NUEVO_MENSAJE"` |
| **Snake_case en BD** | snake_case | `author_id`, `max_members`, `is_active` |
| **CamelCase en código** | camelCase | `authorId`, `maxMembers`, `isActive` |

### Mapping BD ↔ Código

El mapper es explícito (no automático):

```typescript
function mapStudyRequest(row: StudyRequestRow): StudyRequest {
  return {
    id: row.id,
    authorId: row.author_id,
    subjectId: row.subject_id,
    ...
  };
}
```

---

## 5. Manejo de Errores

### 5.1 Jerarquía de errores

```
Error (JS/TS)
  └── ApplicationError (abstracto)
       ├── AuthenticationError        ← HTTP 401
       ├── AuthorizationError         ← HTTP 403
       ├── ValidationError            ← HTTP 400
       │    ├── DtoValidationError    ← Campos obligatorios vacíos
       │    ├── ContentError          ← Palabras prohibidas (reason: "forbidden_words")
       │    ├── SizeError             ← Vacío o muy largo (reason: "empty" | "max_length")
       │    └── MediaError            ← MIME no soportado o filename largo
       ├── NotFoundError              ← HTTP 404
       ├── ConflictError              ← HTTP 409
       └── DomainError                ← HTTP 422 (reglas de negocio)
            └── InvalidStateTransitionError ← Transición de estado no válida
```

### 5.2 Mecanismo centralizado

```typescript
// shared/libs/errors/mapHttpStatus.ts
function mapErrorToHttpStatus(error: unknown): { statusCode: number; message: string }
```

Lógica:
1. Si es `instanceof Error` con `statusCode` → usar su código
2. Si es `Error` genérico → 500
3. Si es desconocido → 500

### 5.3 Saneamiento de errores — **NUEVO**

```typescript
// shared/libs/errors/sanitizeError.ts
function sanitizeError(error: unknown): string
```

Redacta automáticamente antes de llegar al frontend:
- Claves SendGrid: `SG.xxxxx` → `SG.**REDACTED**`
- URLs: `https://...` → `***REDACTED_URL***`
- Rutas Windows/Unix: `C:\...`, `/unix/path` → `***REDACTED_PATH***`

Se aplica en `NotificationService.compilarResumen()` y en los 3 `catch` de estrategias concretas.

### 5.4 Formato de respuesta

```json
// Éxito
{ "data": { ... } }

// Error simple
{ "error": "Resource not found" }

// Error con metadatos
{ "data": [...], "meta": { "total": 42, "page": 0 } }

// Error de validación (CH01)
{
  "name": "ContentError",
  "message": "Mensaje rechazado: contiene palabras no permitidas.",
  "statusCode": 400,
  "reason": "forbidden_words"
}
```

### 5.5 Catálogo de errores de validación

| `name` | `statusCode` | `reason` | Causa |
|---|---|---|---|
| `DtoValidationError` | `400` | — (usar `fields`) | Campo obligatorio vacío |
| `ContentError` | `400` | `"forbidden_words"` | Palabras de lista negra |
| `SizeError` | `400` | `"empty"` | Sin contenido ni adjunto |
| `SizeError` | `400` | `"max_length"` | Excede 5000 caracteres |
| `MediaError` | `400` | `"unsupported_type"` | MIME no permitido |
| `MediaError` | `400` | `"filename_too_long"` | Nombre > 200 chars |
| `DomainError` | `422` | — | Operación inválida para el estado |
| `InvalidStateTransitionError` | `422` | — | Transición no permitida |

### 5.6 Uso del DomainError en la máquina de estados

```typescript
// CerradaState.ts
applyToGroup() {
  throw new InvalidStateTransitionError("El grupo está cerrado. No se aceptan más solicitudes.");
}
```

El estado valida la operación y lanza error si la transición no es válida. El caso de uso no necesita validar — el estado lo hace.

---

## 6. Comunicación entre Servicios

```
┌──────────┐       HTTP         ┌──────────────┐
│ Cliente  │ ──────────────────▶ │   Gateway    │
└──────────┘                     └──────┬───────┘
                                        │
                          ┌─────────────┼──────────────┐
                          │ Proxy HTTP  │              │
                          ▼             ▼              ▼
                     ┌──────────┐ ┌──────────┐  ┌──────────┐
                     │ Service  │ │ Service  │  │ Service  │
                     │   A      │ │   B      │  │   C      │
                     └──────────┘ └──────────┘  └──────────┘
                          │
               ┌──────────┼──────────┐
               │          │          │
          Supabase   Supabase   Supabase
           (BD)     (Realtime)  (Auth)
```

| Mecanismo | Uso |
|---|---|
| **Gateway proxy HTTP** | Enrutamiento de requests de clientes a servicios |
| **Shared libs compiladas** | Código compartido se incluye en cada servicio al compilar (no hay llamadas entre servicios) |
| **Supabase PostgreSQL** | BD compartida — todos los servicios leen/escriben en el mismo esquema |
| **Supabase Realtime** | Notificaciones y mensajería en tiempo real vía WebSocket broadcast |
| **Eventos in-process** | Observer pattern para reacciones dentro del mismo servicio |
| **Gateway JWT** | Token validado en gateway, payload (userId) disponible para servicios |

### Canales Supabase Realtime

| Canal | Servicio emisor | Propósito |
|---|---|---|
| `user-notifications:{userId}` | study-groups, messaging | Notificaciones decoradas + eventos de chat |
| `event-notifications:{userId}` | events | Eventos universitarios por categoría |

Cada gateway (`SupabaseRealtimeGateway`) implementa `IStudyGroupSocketGateway.emitToUser(userId, event, payload)`. Los canales se crean bajo demanda con broadcast `self: true, ack: false`.

---

## 7. Estructura del Gateway

```
gateway/src/
  ├── main.ts                       ← Bootstrap
  ├── app/
  │   └── createGatewayServer.ts    ← Fábrica del servidor HTTP
  ├── middleware/
  │   └── JWTMiddleware.ts          ← Validación JWT manual
  ├── shared/
  │   ├── config/env.ts             ← Env tipado
  │   └── http/proxyRequest.ts      ← Proxy inverso a servicios
  └── types/
```

El gateway no usa framework — rutas evaluadas con `if/else if` sobre `requestUrl.pathname`:

```typescript
if (isAuthRoute(pathname))       → proxy a auth
if (isStudyGroupsRoute(pathname)) → proxy a study-groups (protegido)
if (isResourcesRoute(pathname))  → proxy a resources (protegido)
...
if (isProfileRoute(pathname))    → proxy a profiles-catalog
if (isEventosRoute(pathname))    → proxy a events
```

**Rutas expuestas al frontend:**
- `GET /health`, `/api/v1/auth/*`, `/api/v1/study-groups*`, `/api/v1/notifications*`
- `/api/v1/resources*`, `/api/v1/conversations*`, `/api/v1/messages*`
- `/api/v1/students*`, `/api/v1/catalog*`, `/perfil*`
- `/api/v1/events*`, `/api/v1/eventos/suscribir`, `/api/v1/eventos/suscripciones`

---

## 8. Validación de DTOs

Framework propio en `shared/libs/validation/`:

```typescript
const rules: ValidationRules<CreateStudyGroupDto> = {
  subjectId: [required("subjectId"), uuid("subjectId")],
  title: [required("title"), minLength("title", 3)],
  maxMembers: [numberRange(2, 10, "maxMembers")],
};

validateDto(dto, rules);  // Lanza DtoValidationError o pasa
```

Validadores disponibles: `required`, `email`, `minLength`, `maxLength`, `numberRange`, `oneOf`, `uuid`, `institutionalDomain`.

**`requireTrimmed()`** lanza `DtoValidationError` (HTTP 400) con `fields: { [fieldLabel]: "es obligatorio." }` en vez de `Error` genérico.

---

## 9. Monorepo: Turborepo + pnpm Workspaces

```
backend/
  ├── turbo.json               ← Tasks: dev, build, lint, typecheck, test
  ├── pnpm-workspace.yaml      ← Workspaces: gateway, services/*, shared/*
  ├── tsconfig.base.json       ← Config base compartida
  ├── gateway/                 ← @uniconnect/gateway
  ├── services/                ← @uniconnect/auth, @uniconnect/study-groups, etc.
  ├── shared/                  ← @uniconnect/shared
  ├── infra/                   ← Docker, K8s, CI
  ├── supabase/                ← Migraciones SQL, Edge Functions
  └── tests/                   ← Tests de integración
```

```json
// turbo.json
{
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^test"] }
  }
}
```

---

## 10. Resumen de Madurez Técnica

| Aspecto | Estado |
|---|---|
| **Separación de capas** | ✅ Hexagonal consistente en 5 de 6 servicios |
| **Patrones GoF** | 11 patrones implementados (Singleton, Factory, Decorator×3, Facade, Observer×3, State, Strategy, Chain of Resp., Builder, Repository) |
| **Supabase Realtime** | ✅ 3 gateways implementados (study-groups, messaging, events) en canales `user-notifications:{userId}` y `event-notifications:{userId}` |
| **Notificaciones multicanal** | ✅ InApp WebSocket + Email (SendGrid) + Push (preparado) — selección por preferencias |
| **Validación de mensajes** | ✅ Chain of Responsibility inmutable (tamaño, contenido, adjuntos) con errores tipados |
| **Decoración de notificaciones** | ✅ Prioridad (normal/urgente/critica) + Acciones navegables (label + endpoint) |
| **Saneamiento de errores** | ✅ Redacción automática de claves, URLs y rutas en errores |
| **Testeabilidad** | ✅ Dual InMemory/Postgres repos, inyección manual, eventos fail-safe |
| **Tests** | ✅ 111 tests: decorator (17) + strategy (18) + states (15) + mapper (8) + observer (3+1+16+2) + CH01 validators (21) + sanitizeError (10) + integration |
| **Manejo de errores** | ✅ Jerarquía completa (9 tipos), mapeo a HTTP, errores de dominio tipados |
| **Tipado** | ✅ TypeScript estricto, interfaces I-prefix, eventos discriminados y versionados |
| **Documentación** | ✅ Guías de patrones, contrato frontend en `backend/docs/FRONTEND_INTEGRATION_FINAL.md` |
| **Despliegue** | ✅ Docker multi-stage, Fly.io, K8s manifests |
| **Graceful Shutdown** | ✅ SIGINT/SIGTERM con cleanup |
| **Seguridad** | ✅ JWT manual, CORS configurable, validación de email institucional |
| **Falta** | ❌ Sin rate limiting, sin metrics/monitoring, sin caché, sin CI/CD implementado (solo manifiestos) |

---

## 11. Diagrama de Dependencias entre Capas (por Servicio)

```
┌──────────────────────────────────────────────────────────────┐
│                    interfaces/http/                           │
│  (Controllers, DTOs, Routes, Middlewares)                    │
│  Depende de → application/use-cases                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    application/use-cases/                     │
│  (Casos de uso: orquestan lógica de negocio)                  │
│  Depende de → domain/repositories (interfaces)                │
│  Depende de → domain/events (Subject)                         │
│  Depende de → shared/patterns (chain, strategy, decorator)    │
└──────────────────────────┬───────────────────────────────────┘
                           │
             ┌──────────────┼──────────────┐
             │              │              │
┌───────────▼────┐  ┌──────▼───────┐  ┌──▼────────────┐
│  domain/       │  │ domain/      │  │ domain/       │
│  entities/     │  │ events/      │  │ states/       │
│  (readonly)    │  │ (tipados)    │  │ (State)       │
└────────────────┘  └──────────────┘  └───────────────┘
             │
┌───────────▼──────────────────────────────────────────────────┐
│                    infrastructure/                            │
│  (Postgres*Repository, InMemory*Repository, Database,        │
│   SupabaseRealtimeGateway, etc.)                              │
│  Implementa → domain/repositories (interfaces)                │
│  Implementa → IStudyGroupSocketGateway                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Convenciones Generales del Proyecto

| Convención | Estándar |
|---|---|
| **Lenguaje** | TypeScript 5.7+, `"type": "module"` (ESM) |
| **Formato** | Sin formateador configurado (`echo "format config pending"`) |
| **Linting** | Turborepo task `lint` (no hay config visible de ESLint) |
| **Typecheck** | Turborepo task `typecheck` (tsc --noEmit) |
| **Testing** | `tests/` con `.spec.ts` y `.test.ts` |
| **Gestor de paquetes** | pnpm 9.12 (con lockfile) |
| **Estilo de importaciones** | ESM con extensión `.js` (`import './foo.js'`) |
| **Módulos compartidos** | `shared/libs/`, `shared/patterns/`, `shared/http/`, `shared/contracts/`, `shared/types/` |

---

## 13. Flujo de Notificaciones — Diagrama de Secuencia

```
Estado (StudyGroup)
  │
  ▼
applyToGroup()
  │
  ▼
StudyGroupSubject.emit(event)        ← Observer
  │
  ├─▶ NotificationObserver.handle()
  │     │
  │     ▼
  │   NotificationMapper.map(event)
  │     │  BaseNotification → PriorityDecorator → ActionDecorator
  │     ▼
  │   NotificationService.notificar(dto)
  │     │  Filtra estrategias por preferencias del usuario
  │     │  Promise.allSettled(...)
  │     │
  │     ├─▶ InAppWebSocketStrategy
  │     │      └─▶ SupabaseRealtimeGateway.emitToUser(userId, event, payload)
  │     │             └─▶ Canal user-notifications:{userId}
  │     │
  │     ├─▶ EmailInstitucionalStrategy
  │     │      ├─▶ IUserRepository.getContactInfo(userId) → {email}
  │     │      └─▶ IEmailGateway.enviarEmail(email, subject, body)
  │     │
  │     └─▶ PushMovilStrategy
  │            ├─▶ IUserRepository.getContactInfo(userId) → {pushToken}
  │            └─▶ IPushGateway.enviarPush(token, title, body)
  │
  └─▶ WebSocketNotificationObserver
         └─▶ SupabaseRealtimeGateway.emitToUser(userId, event, payload)

Cliente (Frontend)
  │
  ▼
supabase.channel("user-notifications:{userId}")
  .on("broadcast", { event: "*" }, handler)
  .subscribe()
```

---

## 14. Enlaces relevantes

| Recurso | Ruta |
|---|---|
| Contrato Frontend | `backend/docs/FRONTEND_INTEGRATION_FINAL.md` |
| Strategy Pattern | `backend/shared/patterns/strategy/` |
| Chain of Responsibility | `backend/shared/patterns/chain/message/` |
| Notification Decorators | `backend/shared/patterns/decorator/notification/` |
| State Pattern | `backend/services/study-groups/src/domain/states/` |
| Observer (study-groups) | `backend/services/study-groups/src/domain/events/` |
| Observer (messaging) | `backend/services/messaging/src/domain/events/` |
| Observer (events) | `backend/services/events/src/domain/events/` |
| Supabase Realtime Gateway | `backend/services/*/src/infrastructure/realtime/` |
| Error hierarchy | `backend/shared/libs/errors/` |
| Validation | `backend/shared/libs/validation/` |
