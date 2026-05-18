# CONTEXTO BACKEND - UniConnect

## 1. VISIÓN GENERAL

**Monorepo backend** con arquitectura de microservicios y Clean Architecture.
- **Package Manager:** pnpm 9.12.0
- **Node:** >=20.0.0
- **Tipo:** ESM (`"type": "module"`)
- **Orquestación:** Turbo 2.x para tareas paralelas (dev, build, lint, typecheck, test)
- **Workspace:** gateway, services/*, shared/*

---

## 2. ARQUITECTURA

### Patrón: Clean Architecture + Microservicios

```
Gateway (BFF) ──> JWT Validation ──> Proxy a servicios internos
       │
       ├── Auth Service (3102)
       ├── Study Groups Service (3101)
       ├── Resources Service (3103)
       ├── Messaging Service (3104)
       ├── Profiles-Catalog Service (3105)
       └── Events Service (3106)
```

### Capas por servicio:

```
service/
├── domain/          → Entidades, repositorios (interfaces), eventos, estados
├── application/     → Use-cases, DTOs
├── infrastructure/  → Repositorios (PostgreSQL / InMemory), DB connection, storage
└── interfaces/      → Controladores HTTP, rutas, middlewares
```

---

## 3. GATEWAY (BFF)

**Puerto:** 3000 | **Package:** `@uniconnect/gateway`

- **Proxy HTTP** a microservicios internos con timeout de 10s
- **JWT Middleware** propio (decode base64 + validación de expiración, sin verificación de firma)
- **CORS** habilitado
- **Ruteo:**
  - `OPTIONS *` → CORS preflight
  - `GET /health` → healthcheck
  - `/api/v1/auth/*` → proxy a Auth (sin JWT)
  - `/api/v1/study-groups*`, `/api/v1/notifications*` → Study Groups
  - `/api/v1/resources*` → Resources
  - `/api/v1/conversations*`, `/api/v1/messages*` → Messaging
  - `/api/v1/students*`, `/api/v1/catalog*` → Profiles-Catalog
  - `/api/v1/events*` → Events

---

## 4. SERVICIOS

### 4.1 Auth (`services/auth/` - puerto 3102)

**Dependencias:** bcryptjs, jsonwebtoken

- **Endpoints:** `POST /signup`, `POST /signin`, `POST /refresh`, `GET /session`, `GET /google`
- **Dominio:** User, RefreshToken
- **JWT:** HS256, access + refresh tokens, httpOnly cookies en signin
- **Repo:** PostgreSQLAuthRepository (implementación actual: InMemory - TODO migrar a Postgres)
- **Validación:** Email institucional dominio `@ucaldas.edu.co`
- **OAuth:** Genera URL de Google OAuth vía Supabase (restringido a dominio UCaldas)

### 4.2 Study Groups (`services/study-groups/` - puerto 3101)

**Dependencias:** pg (Postgres client)
**El servicio más complejo.** Implementa State Pattern, Observer Pattern.

- **Endpoints:**
  - `GET/POST /api/v1/study-groups` (listar/crear solicitudes de estudio)
  - `GET /api/v1/study-groups/:id` (detalle)
  - `GET /api/v1/study-groups/:id/members`, `/applications`, `/messages`
  - `POST /api/v1/study-groups/:id/apply`, `/leave`, `/transfer`
  - `PUT /api/v1/study-groups/applications/:id/review`
  - `POST /api/v1/study-groups/transfers/:id/accept`
  - `GET /api/v1/notifications`

- **State Pattern (Ciclo de vida del grupo):**
  - `AbiertaState` → permite aplicar, revisar; transiciona a Llena cuando se completa
  - `LlenaState` → solo permite rechazar
  - `CerradaState` → rechaza toda acción
  - `ExpiradaState` → rechaza toda acción
  - `TransferenciaPendienteState` → decorator durante transferencia de admin

- **Observer Pattern:**
  - Eventos: SOLICITUD_INGRESO, MIEMBRO_ACEPTADO, MIEMBRO_RECHAZADO, TRANSFERENCIA_ADMIN_SOLICITADA, TRANSFERENCIA_ADMIN_ACEPTADA
  - Observers: NotificationObserver (DB), WebSocketNotificationObserver (stub)

- **Entidades:** StudyRequest, Application, Member, AdminTransfer, StudyGroupMessage, UserNotification
- **Repos:** Postgres + InMemory para cada entidad
- **Reglas:** Máximo 3 grupos por materia por usuario, estados mutuamente excluyentes

### 4.3 Resources (`services/resources/` - puerto 3103)

- **Endpoints:** CRUD `/api/v1/resources`
- **Entidad:** StudyResource (id, userId, programId, subjectId, title, description, fileUrl, fileName, fileType, fileSizeKb)
- **Storage:** SupabaseStorageCleaner para eliminar archivos de Supabase Storage
- **Repos:** PostgresStudyResourceRepository + InMemoryStudyResourceRepository

### 4.4 Messaging (`services/messaging/` - puerto 3104)

**Implementa Decorator Pattern + Observer Pattern**

- **Endpoints:**
  - `GET /api/v1/conversations`
  - `POST /api/v1/conversations/get-or-create`
  - `GET /api/v1/conversations/:id`
  - `GET/POST /api/v1/conversations/:id/messages`
  - `PATCH /api/v1/conversations/:id/read`
  - `PATCH /api/v1/messages/:id/read`
  - `GET /api/v1/conversations/:id/unread-count`

- **Decorator Pattern (enriquecimiento de mensajes):**
  - BaseMessage → FileDecorator → MentionDecorator → ReactionDecorator
  - Soporte para: media (imagen/audio/archivo), menciones (@usuario), reacciones, reply

- **Observer Pattern:** ChatSubject por canal (grupo:, dm:), RealtimeObserver + IdempotencyObserver
- **Entidades:** Conversation, Message (con soporte de reply, preview)

### 4.5 Profiles-Catalog (`services/profiles-catalog/` - puerto 3105)

- **Endpoints:**
  - `GET/PATCH /api/v1/profiles/me`
  - `GET /api/v1/profiles/:id/public`
  - `GET /api/v1/students/search?subjectId=...`
  - `GET /api/v1/catalog/programs`
  - `GET /api/v1/catalog/programs/:programId/subjects`

- **Entidades:** Student, Program, Subject, Faculty
- **Repos:** Solo Postgres (sin InMemory fallback)

### 4.6 Events (`services/events/` - puerto 3106)

**Implementa Observer Pattern**

- **Endpoints:** CRUD `/api/v1/events`
- **Entidad:** Event (id, title, description, location, startAt, organizerId, category, imageUrl)
- **Observer:** UniversityEventSubject → UniversityEventObserver (notificaciones + websocket)
- **Suscripciones:** Controlador separado para event_subscriptions

---

## 5. CÓDIGO COMPARTIDO (`shared/`)

### `shared/http/`
- `sendJson`, `sendError`, `sendData` - helpers de respuesta JSON
- `proxyRequest` - forwarding de requests a downstream services

### `shared/libs/`
- **config:** `requiredEnv()` - validador de env vars
- **database:** `DatabaseHandler` - Singleton de pg.Pool (NO usado activamente)
- **errors:** Jerarquía: ApplicationError → DomainError(422), AuthenticationError(401), AuthorizationError(403), ValidationError(400), NotFoundError(404), ConflictError(409), InvalidStateTransitionError(422)
- **logging:** `Logger` Singleton con niveles (DEBUG, INFO, WARN, ERROR) y colores
- **validation:** `Validators` (required, email, minLength, maxLength, numberRange, oneOf, uuid, institutionalDomain) + `validateDto()`

### `shared/patterns/`
- **decorator:** AuthenticationMiddleware, EmailVerificationMiddleware, SemesterCheckMiddleware + MiddlewareChainBuilder
- **facade:** RegistrationFacade, StudyGroupFacade
- **factory:** PublicationFactory → StudyCompanionPublication, ProjectTeamPublication, ResourcePublication, EventPublication
- **observer:** EventBus, EventEmitter, EventFactory, AppNotificationObserver, EmailNotificationObserver, PendingCounterObserver
- **strategy:** INotificationStrategy → EmailInstitucionalStrategy, InAppWebSocketStrategy, PushMovilStrategy + NotificationService

### `shared/contracts/openapi/`
- `openapi.v1.yaml` - Draft OpenAPI 3.1 spec

---

## 6. BASE DE DATOS

### Esquemas principales (PostgreSQL 16 vía Supabase):

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Perfiles de usuario (id, full_name, avatar_url, bio) |
| `faculties` | Facultades académicas |
| `programs` | Programas académicos (id, name, code, faculty_id) |
| `subjects` | Materias (id, name, code, credits, semester) |
| `program_subjects` | Relación programa-materia |
| `study_requests` | Solicitudes de grupo de estudio (con status: abierta/cerrada/expirada) |
| `applications` | Postulaciones a grupos (status: pendiente/aceptada/rechazada) |
| `study_request_admin_transfers` | Transferencias de admin entre miembros |
| `study_group_messages` | Mensajes de grupo (con media, mentions, reactions) |
| `notifications` | Notificaciones in-app |
| `conversations` | Conversaciones 1:1 (participant_a, participant_b) |
| `messages` | Mensajes 1:1 (con reply, media) |
| `study_resources` | Recursos de estudio subidos |
| `events` | Eventos universitarios |
| `event_subscriptions` | Suscripciones a eventos |
| `refresh_tokens` | Tokens de refresh JWT |

### Estrategia:
- **Postgres como principal** con **InMemory como fallback** cuando no hay configuración DB
- Migraciones SQL en `supabase/migrations/` (27 archivos, desde marzo a mayo 2026)

---

## 7. PATRONES DE ARQUITECTURA

| Patrón | Ubicación | Propósito |
|--------|-----------|-----------|
| **Singleton** | shared/libs/database, shared/libs/logging, Database.ts por servicio | Pool de DB y logger únicos |
| **State** | study-groups/domain/states/ | Ciclo de vida del grupo (Abierta → Llena/Cerrada/Expirada → Transferencia) |
| **Observer** | study-groups, messaging, events, shared/patterns/observer/ | Eventos de dominio y notificaciones |
| **Decorator** | messaging/domain/decorators/, shared/patterns/decorator/ | Enriquecimiento de mensajes, middleware chains |
| **Facade** | shared/patterns/facade/, study-groups/interfaces/http/controllers/ | Simplificar operaciones complejas |
| **Factory** | shared/patterns/factory/ | Creación polimórfica de publicaciones |
| **Strategy** | shared/patterns/strategy/ | Algoritmos de notificación intercambiables |
| **Repository** | Todos los servicios | Acceso a datos con interfaz + impl |

---

## 8. INFRAESTRUCTURA

- **Docker:** Multi-stage build (node:20-alpine), Docker Compose local con Postgres 16
- **Fly.io:** Despliegue rolling, health check en `/health`, puerto 3000
- **CI/CD:** GitHub Actions en `infra/ci/backend-ci.yml` (triggers en backend/**)
- **K8s:** Scaffold en `infra/k8s/README.md`

---

## 9. VARIABLES DE ENTORNO

| Variable | Servicios | Propósito |
|----------|-----------|-----------|
| `PORT` | Todos | Puerto del servicio |
| `NODE_ENV` | Todos | Entorno (development/production) |
| `JWT_ACCESS_SECRET` | Gateway, Auth | Secreto JWT |
| `JWT_REFRESH_SECRET` | Auth | Secreto refresh token |
| `DB_HOST/PORT/NAME/USER/PASSWORD/SSL` | study-groups, resources, messaging, profiles-catalog, events | Conexión PostgreSQL |
| `SUPABASE_URL` | Auth, Resources | URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Resources | Service role key |
| `*_BASE_URL` | Gateway | URLs de servicios internos |

---

## 10. ESTADO DE IMPLEMENTACIÓN

| Servicio | Estado | Notas |
|----------|--------|-------|
| **Gateway** | ✅ Completo | Proxy, JWT middleware, CORS, healthcheck |
| **Auth** | ✅ Completo | Signup/signin/refresh, JWT, InMemory (TODO Postgres) |
| **Study Groups** | ✅ Completo | State Pattern, Observer, Postgres + InMemory |
| **Resources** | ✅ Completo | CRUD, Supabase Storage, Postgres + InMemory |
| **Messaging** | ✅ Completo | Decorator Pattern, Observer, Postgres + InMemory |
| **Profiles-Catalog** | ✅ Completo | Solo Postgres (sin InMemory) |
| **Events** | ✅ Completo | Observer Pattern, suscripciones |
