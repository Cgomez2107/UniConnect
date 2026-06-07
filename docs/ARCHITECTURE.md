# UniConnect — Arquitectura Completa del Proyecto

> **Versión:** 1.0  
> **Última actualización:** 2026-05-26  
> **Propósito:** Documento de referencia para entender la totalidad del proyecto, sus flujos, patrones y componentes.

---

## Índice

1. [Visión General](#1-visión-general)
2. [Estructura del Monorepo](#2-estructura-del-monorepo)
3. [Backend — Microservicios](#3-backend--microservicios)
4. [Backend — API Gateway](#4-backend--api-gateway)
5. [Backend — Patrones de Diseño](#5-backend--patrones-de-diseño)
6. [Backend — Shared Library](#6-backend--shared-library)
7. [Web Frontend (React + Vite)](#7-web-frontend-react--vite)
8. [Mobile Frontend (Expo + React Native)](#8-mobile-frontend-expo--react-native)
9. [Paquetes Compartidos (`packages/`)](#9-paquetes-compartidos-packages)
10. [Flujo de Autenticación](#10-flujo-de-autenticación)
11. [Comunicación en Tiempo Real](#11-comunicación-en-tiempo-real)
12. [Flujo de Encuestas (Polls)](#12-flujo-de-encuestas-polls)
13. [Base de Datos (Supabase PostgreSQL)](#13-base-de-datos-supabase-postgresql)
14. [Despliegue](#14-despliegue)
15. [Flujo de Trabajo de Desarrollo](#15-flujo-de-trabajo-de-desarrollo)
16. [Observaciones Arquitectónicas](#16-observaciones-arquitectónicas)

---

## 1. Visión General

**UniConnect** es una red social académica para la Universidad de Caldas. Conecta estudiantes para estudio colaborativo, gestión de recursos académicos, eventos universitarios, mensajería directa y foros temáticos.

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js 20+, TypeScript 5.7+, ESM |
| **Backend orchestration** | pnpm workspaces + Turborepo v2 |
| **API Gateway** | Node.js nativo (`http.createServer`) |
| **Microservicios** | Servidores HTTP puros (sin Express/Fastify) |
| **Frontend Web** | React 19, Vite 8, Tailwind CSS 3.4 |
| **Frontend Mobile** | Expo SDK 54, React Native 0.81, Expo Router |
| **Base de datos** | Supabase (PostgreSQL 16) |
| **Auth** | Supabase Auth + JWT local (bcryptjs + jsonwebtoken) |
| **Tiempo real** | WebSocket (gateway) + Supabase Realtime |
| **Documentación API** | OpenAPI 3.1.0 + Swagger UI |
| **Tipos estrictos** | Zod + openapi-typescript |
| **Estado** | Zustand 5 (web y mobile) |

### Puertos

| Servicio | Puerto |
|----------|--------|
| API Gateway | `3000` |
| study-groups | `3101` |
| auth | `3102` |
| resources | `3103` |
| messaging | `3104` |
| profiles-catalog | `3105` |
| events | `3106` |
| academic-qna | `3107` |
| Web (dev) | `8081` |
| Mobile (dev) | `8081` |

---

## 2. Estructura del Monorepo

```
UniConnect/
├── backend/                          # Backend (pnpm workspace independiente)
│   ├── gateway/                      # API Gateway (proxy reverso + WebSocket)
│   ├── services/
│   │   ├── auth/                     # Autenticación (signup, signin, OAuth, JWT)
│   │   ├── study-groups/             # Grupos de estudio (CRUD, mensajes, encuestas)
│   │   ├── messaging/                # Mensajería directa (DMs, conversaciones)
│   │   ├── resources/                # Recursos académicos
│   │   ├── profiles-catalog/         # Perfiles de estudiantes + catálogo académico
│   │   ├── events/                   # Eventos universitarios
│   │   └── academic-qna/             # Foro de preguntas y respuestas
│   ├── shared/                       # Patrones de diseño + libs compartidas
│   ├── supabase/migrations/          # Migraciones SQL de la BD
│   ├── tests/                        # Tests de características (feature tests)
│   └── infra/docker/                 # Docker Compose local
│
├── web/                              # Frontend web (Vite + React 19)
│   ├── src/
│   │   ├── pages/                    # 34 componentes de página (uno por ruta)
│   │   ├── components/               # UI: chat/, layout/, forum/, groups/, etc.
│   │   ├── store/                    # Zustand stores (wrappers de shared-state)
│   │   ├── hooks/                    # 31 hooks
│   │   ├── lib/                      # Servicios, API clients, mappers
│   │   ├── chat/models/              # Decorator pattern para mensajes
│   │   └── types/                    # Tipos domain (snake_case) + UI (camelCase)
│   └── ...
│
├── frontend/                         # App mobile (Expo + React Native)
│   ├── app/                          # Expo Router (file-based routing)
│   ├── lib/                          # Clean Architecture: use-cases, repositories, mappers
│   ├── store/                        # Zustand stores (implementación custom)
│   ├── components/                   # Componentes compartidos
│   ├── constants/                    # Colores, temas
│   ├── shared-types/                 # COPIA LOCAL de packages/shared-types
│   └── ...
│
├── packages/                         # Paquetes compartidos (web + packages/*)
│   ├── shared-types/                 # Tipos domain, DTOs, Zod schemas, API contracts
│   ├── shared-api/                   # Transport layer, API clients, mappers
│   ├── shared-state/                 # Zustand store factories, storage adapters
│   ├── shared-ui/                    # Design tokens, headless hooks
│   ├── shared-hooks/                 # Hooks compartidos (useAcademicFilter)
│   └── shared-utils/                 # Env validators
│
├── docker-compose.yml                # Stack completo (backend 8 servicios + web + mobile)
├── pnpm-workspace.yaml               # Solo incluye: backend, web, packages/*
└── turbo.json                        # Pipeline de Turborepo
```

### Nota crítica sobre el workspace

El `pnpm-workspace.yaml` raíz incluye solo `backend/`, `web/` y `packages/*`.  
**`frontend/` NO pertenece al workspace raíz** — tiene su propio `pnpm-workspace.yaml` interno y su propia copia de `shared-types`.

---

## 3. Backend — Microservicios

Cada servicio sigue **Domain-Driven Design** con capas:

```
src/
├── main.ts                         # Bootstrap: instancia repos, casos de uso, servidor HTTP
├── application/use-cases/          # Casos de uso (orquestan lógica de negocio)
├── domain/
│   ├── entities/                   # Entidades de dominio
│   ├── repositories/               # Interfaces de repositorio
│   └── events/                     # Eventos + observers
├── infrastructure/
│   ├── database/                   # Implementaciones (Postgres + InMemory)
│   └── realtime/                   # Gateway de tiempo real
└── interfaces/http/
    ├── routes/                     # Routing (regex sobre URL + método HTTP)
    └── controllers/                # Handlers que conectan HTTP → casos de uso
```

### 3.1 Auth Service (`auth`, puerto `3102`)

**Propósito:** Registro, inicio de sesión, OAuth Google, refresh de tokens.

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/signup` | Registro con email `@ucaldas.edu.co` |
| POST | `/signin` | Inicio de sesión (email + password) |
| POST | `/refresh` | Refrescar token de acceso |
| GET | `/oauth-url` | Obtener URL de OAuth Google |
| GET | `/google-callback` | Callback OAuth Google |
| GET | `/health` | Health check |

**Casos de uso:** `SignUp`, `SignIn`, `RefreshToken`, `GoogleSignIn`.

**Flujo de autenticación dual:**
- **Local:** bcryptjs para hash de contraseña + jsonwebtoken para JWT (access 1h, refresh 7d).
- **Google OAuth:** Redirección a Supabase Auth con restricción de dominio `hd=ucaldas.edu.co`.

### 3.2 Study Groups Service (`study-groups`, puerto `3101`)

**Propósito:** Gestión completa de grupos de estudio: solicitudes, aplicaciones, miembros, mensajes, sesiones de estudio, notificaciones, encuestas, transferencias de admin.

**Endpoints principales (~30 rutas):**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/study-groups` | Listar solicitudes (con filtros) |
| POST | `/api/v1/study-groups` | Crear solicitud de grupo |
| GET | `/api/v1/study-groups/:id` | Detalle de solicitud |
| PATCH | `/api/v1/study-groups/:id` | Actualizar solicitud |
| DELETE | `/api/v1/study-groups/:id` | Eliminar solicitud |
| GET | `/api/v1/study-groups/:id/members` | Listar miembros |
| POST | `/api/v1/study-groups/:id/members` | Unirse a grupo |
| DELETE | `/api/v1/study-groups/:id/members/:userId` | Expulsar/abandonar |
| POST | `/api/v1/study-groups/:id/applications` | Postularse |
| GET | `/api/v1/study-groups/:id/applications` | Listar postulaciones |
| PATCH | `/api/v1/study-groups/:id/applications/:appId` | Responder postulación |
| POST | `/api/v1/study-groups/:id/messages` | Enviar mensaje (incluye encuestas) |
| GET | `/api/v1/study-groups/:id/messages` | Listar mensajes |
| POST | `/api/v1/study-groups/:id/messages/:msgId/reactions` | Reaccionar |
| POST | `/api/v1/study-groups/:id/messages/:msgId/polls/vote` | Votar en encuesta |
| POST | `/api/v1/study-groups/:id/messages/:msgId/polls/close` | Cerrar encuesta |
| POST | `/api/v1/study-groups/:id/admin/transfer` | Iniciar transferencia de admin |
| POST | `/api/v1/study-groups/:id/admin/transfer/respond` | Aceptar/rechazar transferencia |
| POST | `/api/v1/study-groups/:id/state` | Cambiar estado del grupo |

**27 casos de uso**, incluyendo: `CreateStudyRequest`, `ApplyToStudyGroup`, `SendMessage`, `VoteInPoll`, `TransferAdmin`, `ToggleReaction`, etc.

### 3.3 Messaging Service (`messaging`, puerto `3104`)

**Propósito:** Mensajería directa entre usuarios (DMs), conversaciones, reacciones, encuestas en DMs, lecturas.

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/conversations` | Listar conversaciones del usuario |
| POST | `/api/v1/conversations` | Crear/get conversación con otro usuario |
| GET | `/api/v1/conversations/:id` | Detalle de conversación |
| PATCH | `/api/v1/conversations/:id` | Marcar como leída |
| GET | `/api/v1/messages` | Listar mensajes de una conversación |
| POST | `/api/v1/messages` | Enviar mensaje (incluye encuestas) |
| PATCH | `/api/v1/messages/:id/read` | Marcar mensaje como leído |
| POST | `/api/v1/messages/:id/reactions` | Reaccionar |
| POST | `/api/v1/messages/:id/polls/vote` | Votar en encuesta |
| POST | `/api/v1/messages/:id/polls/close` | Cerrar encuesta |
| POST | `/api/v1/polls/:pollId/votes` | Votar (nuevo sistema) |

**Decorator Pattern** en la capa de dominio para composición de mensajes:
```
IMessage → BaseMessage → MessageDecorator
                            ├── FileDecorator (archivos adjuntos)
                            ├── MentionDecorator (@menciones)
                            ├── ReactionDecorator (reacciones emoji)
                            └── PollDecorator (encuestas)
```

### 3.4 Resources Service (`resources`, puerto `3103`)

**Propósito:** CRUD de recursos académicos, scraping de metadatos OpenGraph, validación de permisos.

**Endpoints:** CRUD completo en `/api/v1/resources/*`.

### 3.5 Profiles-Catalog Service (`profiles-catalog`, puerto `3105`)

**Propósito:** Perfiles de estudiantes, catálogo académico (facultades, programas, materias), búsqueda.

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/PATCH | `/api/v1/students/:id` | Perfil de estudiante |
| GET | `/api/v1/catalog/faculties` | Listar facultades |
| GET | `/api/v1/catalog/programs` | Listar programas |
| GET | `/api/v1/catalog/subjects` | Listar materias |
| GET | `/api/v1/catalog/subjects/:id/students` | Estudiantes por materia |

### 3.6 Events Service (`events`, puerto `3106`)

**Propósito:** CRUD de eventos universitarios, suscripciones, broadcast en tiempo real.

**Endpoints:** CRUD en `/api/v1/events/*`, suscripciones en `/api/v1/events/:id/subscribe`.

### 3.7 Academic-QnA Service (`academic-qna`, puerto `3107`)

**Propósito:** Foro de preguntas y respuestas académicas, votación, marcado de solución.

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/v1/forum/questions` | Listar/crear preguntas |
| GET/POST | `/api/v1/forum/questions/:id/answers` | Listar/crear respuestas |
| POST | `/api/v1/forum/answers/:id/vote` | Votar respuesta |
| POST | `/api/v1/forum/answers/:id/solution` | Marcar como solución |

---

## 4. Backend — API Gateway

**Puerto:** `3000`  
**Archivo principal:** `backend/gateway/src/app/createGatewayServer.ts`

### Funcionalidades

1. **Proxy reverso** — Mapea rutas a microservicios:
   ```
   /api/v1/auth/*                    → auth:3102
   /api/v1/study-groups/*            → study-groups:3101
   /api/v1/resources/*               → resources:3103
   /api/v1/conversations/*           → messaging:3104
   /api/v1/messages/*                → messaging:3104
   /api/v1/polls/*                   → messaging:3104
   /api/v1/students/*                → profiles-catalog:3105
   /api/v1/catalog/*                 → profiles-catalog:3105
   /perfil/*                         → profiles-catalog:3105
   /api/v1/events/*                  → events:3106
   /api/v1/forum/*                   → academic-qna:3107
   ```

2. **Middleware JWT** — Extrae token de `Authorization: Bearer` o cookie, valida expiración (sin verificar firma en dev — simplificado).

3. **WebSocket** — Gestión de salas:
   - `conversationRooms`: `Map<conversationId, Set<WebSocket>>` para DMs
   - `studyGroupRooms`: `Map<groupId, Set<WebSocket>>` para grupos
   - Cliente envía `{ type: "subscribe", conversationId? | groupId? }`
   - Gateway emite eventos en respuestas proxy (`onStudygroupsResponse`, `onMessagingResponse`)

4. **Swagger UI** — Sirve OpenAPI combinado en `/docs`.

5. **CORS** — Permite `localhost:8081`, `localhost:8082`, `uniconnect-dashboard-web.fly.dev`.

### Eventos WebSocket emitidos por el Gateway

| Evento | Disparador |
|--------|------------|
| `new_group_message` | POST mensaje en grupo |
| `new_message` | POST mensaje en DM |
| `reaction_updated` | POST reacción (grupo o DM) |
| `poll_updated` | POST voto en encuesta (grupo o DM) |
| `message_read` | PATCH marcar como leído |

---

## 5. Backend — Patrones de Diseño

El backend implementa 6 patrones GoF en `backend/shared/patterns/`:

### 5.1 Decorator (Middleware HTTP)

```typescript
Middleware (abstract)
├── AuthenticationMiddleware  ← Verifica JWT
├── EmailVerificationMiddleware  ← Verifica email confirmado
└── SemesterCheckMiddleware  ← Verifica semestre activo
```

`MiddlewareChainBuilder` proporciona API fluida para encadenar.

### 5.2 Decorator (Mensajes de Chat)

```
IMessage (interface)
├── getContent(): string
├── getMetadata(): Record<string, unknown>
└── render(): React.ReactNode

BaseMessage (concreto)

MessageDecorator (abstract)
├── FileDecorator       ← archivos adjuntos (url, mimeType, tamaño)
├── MentionDecorator    ← @menciones (parsea y renderiza)
├── ReactionDecorator   ← reacciones emoji
└── PollDecorator       ← encuestas (opciones, votos, estado)

Composición: new PollDecorator(
                 new ReactionDecorator(
                     new FileDecorator(
                         new BaseMessage(...), fileMeta), reactions), poll)
```

### 5.3 Decorator (Notificaciones)

```
INotification → BaseNotification → NotificationDecorator (abstract)
                                       ├── PriorityDecorator
                                       └── ActionDecorator
```

### 5.4 Observer

- **EventBus** (global, singleton): `AppNotificationObserver`, `EmailNotificationObserver`, `PendingCounterObserver`
- **StudyGroupSubject**: Observadores para mensajes de sistema, notificaciones, persistencia, sesiones, WebSocket
- **ChatSubject** (por canal): Aísla observers por `conversationId` — evita broadcasts innecesarios

### 5.5 Strategy (Notificaciones)

```
INotificationStrategy
├── EmailInstitucionalStrategy   ← SendGrid vía Supabase Admin
├── InAppWebSocketStrategy       ← Persiste en BD + emite por WebSocket
├── PushMovilStrategy            ← Firebase Cloud Messaging (scaffolded)
└── SlackStrategy                ← Webhook de Slack (scaffolded)

NotificationService
  └── filtra canales según preferencias del usuario (IPreferenceService)
```

### 5.6 State (Transferencia de Admin)

```
IState
├── Active              ← Estado normal del grupo
├── PendingTransfer     ← Transferencia solicitada, esperando aceptación
├── TransferAccepted    ← Nuevo admin confirmado
├── Blocked             ← Grupo bloqueado
└── Dissolved           ← Grupo disuelto

GroupContext.transitionTo(nextState)
  └── valida transiciones permitidas
```

### 5.7 Facade

- `RegistrationFacade`: Creación de usuario + verificación email + inicialización perfil
- `StudyGroupFacade`: Creación de grupo + membresía + configuración + notificación

### 5.8 Factory

- `PublicationFactory.create(config)`: Retorna `StudyCompanionPublication`, `ProjectTeamPublication`, `ResourcePublication`, o `EventPublication` según `config.type`.

---

## 6. Backend — Shared Library

`backend/shared/libs/` contiene utilidades transversales:

| Módulo | Descripción |
|--------|-------------|
| `errors/ApplicationError.ts` | Clase base con `statusCode` + `code` + `toJSON()` |
| `errors/` | Jerarquía: `ValidationError`, `AuthenticationError`, `NotFoundError`, `ConflictError`, etc. |
| `errors/sanitizeError.ts` | Sanitiza errores para respuestas seguras |
| `database/DatabaseHandler.ts` | Singleton Pool de PostgreSQL |
| `logger/` | Logger JSON estructurado |
| `config/env.ts` | Cargador de env vars con validación |

---

## 7. Web Frontend (React + Vite)

**Ubicación:** `web/`  
**Stack:** React 19 + Vite 8 + Tailwind CSS 3.4 + Zustand 5 + React Router v7

### 7.1 Routing (`src/App.tsx`)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/login` | `LoginPage` | Login email/password + Google OAuth |
| `/oauth-callback` | `OAuthCallbackPage` | Callback Google OAuth |
| `/solicitudes` | `SolicitudesPage` | Feed de solicitudes de grupo |
| `/nueva-solicitud` | `NuevaSolicitudPage` | Crear solicitud |
| `/solicitudes/:id` | `SolicitudDetailPage` | Detalle de solicitud |
| `/postular/:id` | `PostularPage` | Postularse a grupo |
| `/invitaciones` | `InvitationsPage` | Invitaciones + postulaciones |
| `/grupos/:groupId` | `GroupDetailPage` | Detalle de grupo |
| `/grupos/:groupId/admin` | `GroupAdminPage` | Chat + admin del grupo |
| `/chat` | `ChatPage` | Mensajería directa |
| `/mensajes` | `MensajesPage` | Lista de conversaciones |
| `/perfil` | `PerfilPage` | Perfil del usuario |
| `/editar-perfil` | `EditProfilePage` | Editar perfil |
| `/perfil-estudiante/:id` | `StudentProfilePage` | Perfil de otro estudiante |
| `/companeros` | `CompanionsPage` | Directorio de compañeros |
| `/recursos` | `RecursosPage` | Recursos académicos |
| `/subir-recurso` | `SubirRecursoPage` | Subir recurso |
| `/eventos` | `EventosPage` | Eventos |
| `/crear-evento` | `CrearEventoPage` | Crear evento |
| `/foro` | `ForumPage` | Foro de preguntas |
| `/foro/:id` | `ForumQuestionPage` | Pregunta + respuestas |
| `/notificaciones` | `NotificationsPage` | Centro de notificaciones |
| `/ajustes-notificaciones` | `NotificationSettingsPage` | Preferencias |
| `/calendario` | `StudyCalendarPage` | Calendario de estudio |
| `/admin` | `AdminPage` | Panel de admin (rol admin) |
| `/viewer` | `ViewerPage` | Visor de archivos |

### 7.2 State Management

```typescript
// store/deps.ts — Contenedor DI central
FetchTransport(GATEWAY_URL)
  ├── setAuthProvider()                    ← localStorage token
  ├── setTokenRefreshProvider()            ← POST /auth/refresh
  └── setOnSessionExpired()                ← redirect /login

AuthClient, BaseMessagingClient, StudyGroupsClient, ProfilesClient,
ResourcesClient, EventsClient, NotificationsClient, AdminClient, ForumClient
StudySessionsClient, RealtimeChatDecorator
```

**Stores** (Zustand, wrappers de `@uniconnect/shared-state`):
| Store | Propósito |
|-------|-----------|
| `useAuthStore` | Auth state (user, session, login/logout/hydrate) |
| `useConversationsStore` | Conversaciones, mensajes |
| `useNotificationStore` | Notificaciones, preferencias |
| `useUnreadCountStore` | Contador no leídos |

### 7.3 API Layer

**Dual system (en migración):**
1. **Nuevo:** `FetchTransport` + `deps.apiClients.*` (de `@uniconnect/shared-api`)
2. **Legado:** `apiClient` (Axios) en `src/lib/api/client.ts` — usado para reacciones, votos, etc.

### 7.4 Componentes de Chat

| Componente | Ruta | Función |
|-----------|------|---------|
| `MessageBubble` | `components/chat/MessageBubble.tsx` | Renderiza mensaje individual: decorator, reactions, poll inline |
| `MentionInput` | `components/chat/MentionInput.tsx` | Input con @mentions, adjuntos, creador de encuestas |
| `PollMessage` | `components/chat/PollMessage.tsx` | Renderiza encuesta: botones/votos, porcentajes, votantes |
| `PollCreator` | `components/chat/PollCreator.tsx` | Formulario para crear encuesta |
| `ReactionBar` | `components/chat/ReactionBar.tsx` | Barra de reacciones emoji |

### 7.5 Decorator Pattern (Web)

Réplica simplificada del patrón del backend, en `src/chat/models/`:

```
IMessage → BaseMessage → MessageDecorator
                            ├── FileDecorator
                            ├── MentionDecorator
                            ├── ReactionDecorator
                            └── PollDecorator

messageFactory.buildDecoratedMessage(raw)
  └── Aplica decoradores condicionalmente según datos presentes
```

### 7.6 Hooks principales (~31 hooks)

| Hook | Propósito |
|------|-----------|
| `useAuth` | Login/logout/restore session |
| `useFeed` | Feed paginado de solicitudes |
| `useChatObserver` | Suscripción Supabase Realtime a mensajes de grupo |
| `useGroupEventsObserver` | Suscripción a cambios en miembros/applications |
| `useConversations` | Carga conversaciones y mensajes |
| `useMessages` | Envío de mensajes |
| `useMessageValidation` | Validación de contenido (largo, palabras prohibidas) |
| `useNotifications` | Toast notifications |
| `useRealtimeNotifications` | WebSocket para notificaciones en tiempo real |
| `useProfileNames` | Resuelve userId → nombre (con caché) |

---

## 8. Mobile Frontend (Expo + React Native)

**Ubicación:** `frontend/`  
**Stack:** Expo SDK 54 + React Native 0.81 + Expo Router

### 8.1 Routing (Expo Router, file-based)

```
app/
├── _layout.tsx               ← Root layout (Stack navigator)
├── index.tsx                 ← Splash + redirect
├── login.tsx
├── (tabs)/                   ← 6 tabs: Feed, Solicitudes, Foro, Mensajes, Eventos, Perfil
├── (admin)/                  ← Panel admin (role-gated)
├── chat/[conversationId].tsx
├── solicitud/[id].tsx
├── study-groups/[id]/
├── recurso/[id].tsx
├── eventos/[id].tsx
├── foro/pregunta/
├── crear-evento.tsx
├── subir-recurso.tsx
└── ...
```

### 8.2 Arquitectura (Clean Architecture)

```
lib/
├── services/
│   ├── di/container.ts           ← Mega DI container (802 líneas, singleton, ~70 use cases)
│   ├── domain/
│   │   ├── use-cases/            ← 13 dominios con casos de uso
│   │   ├── repositories/         ← Interfaces (IStudyRequestRepository, etc.)
│   │   └── entities/             ← Entidades de dominio
│   ├── infrastructure/
│   │   ├── repositories/         ← Api* / Supabase* repository implementations
│   │   └── mappers/              ← Mapeo API → Domain
│   └── pushService.ts
├── api/                          ← 3 clientes HTTP (Supabase, fetch, Axios)
├── store/                        ← Zustand stores (implementación custom, NO shared-state)
└── patterns/                     ← chain/, state/, strategy/
```

### 8.3 Diferencias clave con Web

| Aspecto | Web | Mobile |
|---------|-----|--------|
| **Arquitectura** | Simple (service layer) | Clean Architecture (use cases + repos) |
| **API transport** | `FetchTransport` (shared-api) | Supabase JS directo + Axios + fetch |
| **Stores** | Wrappers de `@uniconnect/shared-state` | Implementación custom |
| **Paquetes compartidos** | Usa los 6 `packages/*` | Solo copia local de `shared-types` |
| **Push notifications** | No | Sí (Expo Notifications) |
| **Tiempo real** | WebSocket + Supabase Realtime | Supabase Realtime principalmente |

---

## 9. Paquetes Compartidos (`packages/`)

### 9.1 `@uniconnect/shared-types`

**Propósito:** Tipos compartidos entre frontends, Zod schemas, API contracts.

```
src/
├── domain.ts               ← Tipos de dominio (camelCase)
├── dto.ts                  ← Tipos DTO (snake_case, reflejan API)
├── schemas/                ← Zod schemas por dominio
│   ├── auth.schema.ts
│   ├── messaging.schema.ts (incluye PollDataSchema, PollOptionSchema)
│   ├── study-group.schema.ts
│   ├── resource.schema.ts
│   ├── event.schema.ts
│   └── ...
├── api/                    ← API Contracts (método + path + schemas request/response)
│   ├── auth.contract.ts
│   ├── messaging.contract.ts
│   └── ...
├── lib/mappers.ts          ← snakeToCamel / camelToSnake
└── generated/              ← Tipos generados desde OpenAPI
```

### 9.2 `@uniconnect/shared-api`

**Propósito:** Transport layer HTTP, API clients, mappers.

```
src/
├── transport/
│   ├── ITransport.ts          ← Interfaz (get, post, patch, delete)
│   ├── BaseTransport.ts       ← Abstracto con manejo de errores
│   ├── FetchTransport.ts      ← Implementación con fetch nativo
│   └── FetchWebSocketClient.ts ← Cliente WebSocket
├── clients/
│   ├── AuthClient.ts
│   ├── BaseMessagingClient.ts
│   ├── RealtimeChatDecorator.ts  ← Envoltorio que añade realtime
│   ├── StudyGroupsClient.ts
│   ├── ProfilesClient.ts
│   ├── ResourcesClient.ts
│   ├── EventsClient.ts
│   ├── NotificationsClient.ts
│   ├── ForumClient.ts
│   ├── AdminClient.ts
│   └── StudySessionsClient.ts
├── mappers/
│   ├── snakeToCamel.ts
│   ├── camelToSnake.ts
│   └── entityMappers.ts
└── services/
    └── StorageService.ts       ← Supabase Storage
```

### 9.3 `@uniconnect/shared-state`

**Propósito:** Fábricas de Zustand stores + adaptadores de almacenamiento.

```
src/
├── stores/
│   ├── createAuthStore.ts          ← Auth con persist middleware
│   ├── createConversationsStore.ts ← Conversaciones + mensajes
│   ├── createNotificationStore.ts  ← Notificaciones
│   └── createUnreadCountStore.ts   ← Contador no leídos
├── adapters/
│   ├── WebStorageAdapter.ts        ← localStorage
│   └── IStorageAdapter.ts          ← Interfaz (para mobile poder implementar AsyncStorage)
├── observers/
│   └── NotificationSubject.ts      ← Observer pattern
└── types.ts                        ← StoreDeps, Logger
```

### 9.4 Otros paquetes

| Paquete | Contenido |
|---------|-----------|
| `@uniconnect/shared-ui` | Design tokens (colores, spacing, tipografía) + headless hooks |
| `@uniconnect/shared-hooks` | `useAcademicFilter` |
| `@uniconnect/shared-utils` | `validateWebEnv()`, `validateBackendEnv()` |

---

## 10. Flujo de Autenticación

### 10.1 Login Email/Password

```
Usuario → LoginPage → useAuth().login(email, password)
  → useAuthStore.signIn(data)
    → deps.apiClients.auth.signIn(data)
      → POST /api/v1/auth/signin
        → AuthService valida email @ucaldas.edu.co
        → bcryptjs.compare(password, hash)
        → jsonwebtoken.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: "1h" })
        → Genera refresh token (7d), almacena en public.refresh_tokens
        ← Retorna { accessToken, refreshToken, user }
  → localStorage.setItem("uniconnect-auth-session", { state: { accessToken, refreshToken } })
  → Redirect según role: /solicitudes (student) o /admin (admin)
```

### 10.2 Google OAuth

```
LoginPage → click Google → GET /oauth-url → redirect a Supabase Google Auth
  → Google auth con hd=ucaldas.edu.co
  → Redirect a app /oauth-callback#access_token=...&refresh_token=...
  → OAuthCallbackPage extrae tokens del hash
  → Decodifica JWT para email
  → POST /auth/oauth/callback con código
  → Almacena sesión, redirect a /solicitudes
```

### 10.3 Restauración de Sesión

```
main.tsx
  → useAuthStore.getState().hydrate()
    → Lee "uniconnect-auth-session" de localStorage
    → Valida expiración del token
    → Si expirado: intenta refresh con POST /auth/refresh
    → Si refresh falla: limpia sesión, redirect a /login
```

### 10.4 Token Refresh Automático

```
FetchTransport.setTokenRefreshProvider()
  → POST /auth/refresh con refreshToken
  → Actualiza localStorage con nuevos tokens
  → En caso de error: onSessionExpired → limpia sesión → redirect a /login

Axios interceptor (apiClient)
  → En 401: limpia localStorage, redirect a /login
```

---

## 11. Comunicación en Tiempo Real

### 11.1 WebSocket (Gateway)

**Conexión:** `ws://gateway:3000/ws?token=<jwt>`

**Protocolo:**
```json
// Cliente → Servidor
{ "type": "subscribe", "conversationId": "..." }
{ "type": "subscribe", "groupId": "..." }
{ "type": "unsubscribe", "conversationId": "..." }

// Servidor → Cliente (broadcast)
{ "event": "new_group_message", "payload": { ... } }
{ "event": "new_message", "payload": { ... } }
{ "event": "reaction_updated", "payload": { ... } }
{ "event": "poll_updated", "payload": { ... } }
{ "event": "message_read", "payload": { ... } }
```

**Salas:** `conversationRooms: Map<conversationId, Set<WebSocket>>` y `studyGroupRooms: Map<groupId, Set<WebSocket>>`.

**Disparo:** Los response hooks del gateway (`onStudygroupsResponse`, `onMessagingResponse`) emiten eventos a las salas correspondientes después de que un proxy devuelve una respuesta exitosa.

### 11.2 Supabase Realtime

Usado para:
- **Study-groups:** `supabase.channel("study-group-<id>").on("postgres_changes", { event: "INSERT", schema: "public", table: "study_group_messages" }, ...)`
- **Events:** Broadcast de nuevos eventos
- **Academic-QnA:** Broadcast de nuevas preguntas/respuestas

### 11.3 ChatSubject (Messaging Service)

Aislamiento por canal: cada `conversationId` tiene su propio set de observers. Cuando se emite un evento, solo los observers de ese canal lo reciben.

---

## 12. Flujo de Encuestas (Polls)

### 12.1 Creación (Web)

```
MentionInput → usuario click "📊" → PollCreator modal
  → Usuario ingresa: pregunta + opciones (mín 2) + duración
  → PollCreator.onPollsCreate(pollData)
  → MentionInput guarda como pendingPoll
  → Usuario hace clic en enviar

GroupAdminPage.handleSend(content, mentions, { poll })
  → POST /api/v1/study-groups/:id/messages
    → studyGroupsService.sendGroupMessage(id, content, { poll })
      → Backend crea mensaje con poll_data (JSONB) en study_group_messages
      → Gateway emite "new_group_message" vía WebSocket
  → Mensaje aparece optimistamente en el chat
```

### 12.2 Representación visual

```
MessageBubble
  → buildDecoratedMessage(raw)  ← Aplica PollDecorator si raw.poll existe
  → {message.poll && <PollMessage poll={message.poll} ... />}
    → PollMessage:
      - showResults = isClosed || hasVoted
        - false: botones clickeables con opciones
        - true: barras de resultados con % + lista expandible de votantes
      - isClosed = !poll.isOpen
      - hasVoted = currentUserId ∈ alguna option.votes
```

### 12.3 Votación

```
PollMessage → click opción
  → onVote(optionIndex)
    → MessageBubble: onVote(message.id, optionIndex)
      → handleVote(messageId, optionIndex)
        → POST /api/v1/study-groups/:id/messages/:msgId/polls/vote
          Body: { optionIndex: number }
          → Backend:
            1. Busca mensaje, extrae poll_data
            2. Remueve userId de todas las opciones (permite cambiar voto)
            3. Agrega userId a la opción seleccionada
            4. Actualiza poll_data en BD
            5. Gateway emite "poll_updated" vía WebSocket
          ← 200 { request_id, message_id, poll }
        → setMessages actualiza poll en el mensaje optimistamente
        → PollMessage se re-renderiza mostrando resultados
```

### 12.4 Votantes

En la vista de resultados, al hacer clic en una opción se expande una lista de nombres debajo. Los nombres se resuelven mediante `voterMap: Record<string, string>` (userId → fullName), construido desde la lista de miembros del grupo.

### 12.5 Cierre automático

El backend usa `PollTimerService` (en messaging service) para cerrar encuestas automáticamente cuando expira su `closesAt`.

---

## 13. Base de Datos (Supabase PostgreSQL)

### Esquemas principales

```sql
-- Auth (público + Supabase Auth managed)
public.auth_users           -- Usuarios locales (email, password_hash)
public.refresh_tokens       -- Tokens de refresco JWT

-- Study Groups
public.study_requests       -- Solicitudes de grupo
public.applications         -- Postulaciones a grupos
public.members              -- Miembros de grupos
public.admin_transfers      -- Transferencias de admin
public.study_group_messages -- Mensajes de grupo (con JSONB: reactions, poll_data, mentions)
public.study_sessions       -- Sesiones de estudio
public.session_series       -- Series de sesiones
public.session_attendees    -- Asistentes a sesiones

-- Messaging
public.conversations        -- Conversaciones DM
public.messages             -- Mensajes DM (con JSONB: reactions, poll_data)

-- Resources
public.study_resources      -- Recursos académicos

-- Profiles & Catalog
public.students             -- Perfiles de estudiantes
public.faculties            -- Facultades
public.programs             -- Programas académicos
public.subjects             -- Materias
public.enrollments          -- Matrículas (estudiante ↔ materia)

-- Events
public.events               -- Eventos universitarios
public.event_subscriptions  -- Suscripciones a eventos

-- Forum
public.forum_questions      -- Preguntas del foro
public.forum_answers        -- Respuestas
public.forum_votes          -- Votos en respuestas

-- Notifications
public.notifications        -- Notificaciones
```

### Convenciones

- **snake_case** para nombres de columnas
- **JSONB** para datos flexibles (reacciones, encuestas, menciones)
- Prefijo `get_*` para funciones SQL que encapsulan lógica (ej: `get_study_group_messages`, `insert_study_group_message`)
- Migraciones en `backend/supabase/migrations/`

### Funciones SQL principales

```sql
get_study_group_messages(request_id, actor_user_id, page_size, offset)
insert_study_group_message(request_id, sender_id, content, ...)
is_request_member(request_id, user_id) → boolean
```

---

## 14. Despliegue

### 14.1 Docker Compose (desarrollo local)

```bash
docker-compose up -d       # Inicia todos los servicios
docker-compose down        # Detiene todo
```

**Servicios en Docker Compose:**
- `gateway` (3000)
- `auth` (3102)
- `study-groups` (3101)
- `resources` (3103)
- `messaging` (3104)
- `profiles-catalog` (3105)
- `events` (3106)
- `academic-qna` (3107)
- `web` (8080 — producción build)
- `frontend` (8081 — Expo dev)

### 14.2 Fly.io (producción)

Cada servicio tiene su `fly.toml` en la raíz o en su directorio.

### 14.3 Variables de Entorno Requeridas

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=
SENDGRID_API_KEY=
SLACK_WEBHOOK_URL=
NODE_ENV=
PORT=
LOG_LEVEL=
```

---

## 15. Flujo de Trabajo de Desarrollo

### 15.1 Scripts disponibles

```bash
pnpm typecheck     # Typecheck en todos los workspaces
pnpm build         # Build en todos los workspaces
pnpm dev           # Dev servers
pnpm lint          # Lint
pnpm test          # Tests
pnpm format        # Formateo
```

### 15.2 Tests

| Tipo | Ubicación | Framework |
|------|-----------|-----------|
| Feature tests | `backend/tests/feat/` | `node:test` o Vitest |
| Unit tests | `backend/shared/**/__tests__/` | Vitest |
| Unit tests (study-groups) | `backend/services/study-groups/test/` | Jest |
| Unit tests (messaging) | `backend/services/messaging/test/` | Vitest |
| Integration | `backend/services/*/test/` | Varios |

### 15.3 Commits

Conventional Commits:
```
feat(scope): descripción
fix(scope): descripción
chore(scope): descripción
docs(scope): descripción
```

Ejemplos reales:
```
feat(polls): implement interactive voting with revote and voter display
feat(US-V03): implement decorators, OG extraction, edit guard, backend filters
fix(ci): rewrite auth integration tests with supertest
docs(ci): add CI/CD pipeline documentation with mermaid diagram
```

---

## 16. Observaciones Arquitectónicas

### 16.1 Deuda Técnica Identificada

1. **Dual API system (web):** El frontend web está migrando de Axios legacy (`apiClient`) a `FetchTransport` + `deps.apiClients.*`. Muchos servicios legacy (`auth.service.ts`, `studyGroups.service.ts`) son wrappers delgados marcados como `@deprecated`.

2. **`frontend/shared-types/` es un fork:** Es una copia de `packages/shared-types/` que debe mantenerse sincronizada manualmente. Ya tiene diferencias (falta `study-session.schema.ts`).

3. **Route inconsistencies (web):** Varias rutas en `constants/navigation.ts` (sidebar) difieren de las rutas reales en `App.tsx`. Ej: sidebar tiene `/forum`, `/calendario-estudio`, `/ajustes/notificaciones` mientras que el router usa `/foro`, `/calendario`, `/ajustes-notificaciones`. Son links muertos.

4. **Tres clientes HTTP en mobile:** `client.ts` (Supabase abstraction), `httpClient.ts` (fetch), `axiosClient.ts` (Axios). Deuda arquitectónica.

5. **Mobile stores no usan shared-state:** A pesar de existir `@uniconnect/shared-state` con store factories, mobile implementa sus stores desde cero.

6. **JWT verification simplificada en gateway:** `JWTMiddleware` decodifica base64url sin verificar firma. Comentario dice _"En producción, importar 'jsonwebtoken' para validación segura"_.

7. **WebSocket en gateway vs Supabase Realtime:** Dos sistemas de tiempo real coexistiendo. Los grupos de estudio usan ambos (WebSocket para broadcasts de mensajes, Supabase Realtime para suscripciones).

### 16.2 Patrón de Mensajería

```
Backend                          Frontend Web
──────                          ────────────
Message (domain entity)          MessageUI (camelCase)
  ├── Decorators aplicados        ├── poll?: PollDataUI
  │   en capa de dominio          ├── reactions?: MessageReactionUI[]
  │   (File, Mention,             ├── mentions?: MessageMentionUI[]
  │    Reaction, Poll)            └── mediaUrl?: string
  └── JSONB en PostgreSQL
        └── poll_data
              └── options: [{ text, votes: [userId, ...] }]
```

### 16.3 Estados de Mensajes (Web)

| Estado | Descripción |
|--------|-------------|
| `sending` | Mensaje optimista, aún no confirmado |
| `sent` | Confirmado por backend |
| `failed` | Error al enviar (con botón "Reintentar") |

### 16.4 Estados de Encuesta

| Estado | Condición | UI |
|--------|-----------|-----|
| Activa, no votó | `isOpen && !hasVoted` | Botones clickeables |
| Activa, votó | `isOpen && hasVoted` | Barras de % + puede cambiar voto |
| Cerrada | `!isOpen` | Barras de % (solo lectura) |

---

*Este documento se genera y actualiza conforme evoluciona el proyecto. Última actualización: 2026-05-26.*
