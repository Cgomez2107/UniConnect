# Diseño Técnico: shared-state, shared-api y shared-ui

Fecha: 2026-05-08

Resumen
- Documento técnico que define el diseño exacto para `packages/shared-state`, `packages/shared-api` (con Adapter/Mapper snake→camel) y `packages/shared-ui` (mínimo para Auth, Admin, Chat).

1) Principios comunes
- `shared-types` será la única fuente de verdad para interfaces, DTOs y eventos. Todos los paquetes importan desde `@uniconnect/shared-types`.
- Cada paquete tendrá su propio `package.json`, `tsconfig.json` (composite) y build script. El CI ejecutará `pnpm -w -r run typecheck` y `pnpm -w -r run build` cuando aplique.
- No se introducen nuevos tests unitarios con mocks en esta fase; sólo `tsc`/type-check como control.

2) `shared-state` — Diseño detallado (Zustand agnóstico)

API pública
- Exponer factories en lugar de singletons:
  - `createAuthStore(deps: StoreDeps): AuthStore`
  - `createNotificationStore(deps: StoreDeps): NotificationStore`
  - `createConversationsStore(deps: StoreDeps): ConversationsStore`

`StoreDeps` (interfaz)
- `apiClients: ApiClients` (tipado desde `shared-api`)
- `storage: IStorageAdapter` (ver abajo)
- `logger?: Logger`

IStorageAdapter
- Interfaz:
  - `getItem(key: string): Promise<string | null>`
  - `setItem(key: string, value: string): Promise<void>`
  - `removeItem(key: string): Promise<void>`
- Implementaciones:
  - `webStorageAdapter` → adaptador promisified para `localStorage` (o `sessionStorage`) para web
  - `asyncStorageAdapter` → usa `@react-native-async-storage/async-storage` para mobile
  - `noopStorageAdapter` → para entornos CI/SSR

Persistencia y Middleware
- `shared-state` exporta un helper `withPersistence(createStoreFactory, storageAdapter, opts)` que aplica el middleware `persist` de Zustand de forma agnóstica.

Hydration y SSR
- Stores deben exponer `hydrate()` async para procesos que necesiten restauración ordenada; en web esto se ejecuta en bootstrapping antes de render.

Side effects y DI
- Todas las llamadas HTTP/side-effects se deben realizar a través de `deps.apiClients`. Ningún store debe usar fetch/axios directamente.

Ejemplo flujo login (alto nivel)
1. UI llama `authStore.login(email,password)`.
2. Store usa `deps.apiClients.auth.signIn()`.
3. `AuthClient` devuelve tokens y user en camelCase (mapper aplicado en `shared-api`).
4. Store persiste tokens con `storage` y actualiza estado.

Testing/Type Safety
- Escribimos pruebas de tipo (`tsc`) y tests de integración manuales; no se añaden mocks automáticos.

3) `shared-api` — Diseño exacto con Adapter/Mapper snake→camel

Arquitectura general
- Capas:
  1. `ITransport` (abstracción de transporte)
  2. `Transport Implementations` (axiosTransport / fetchTransport / expoTransport)
  3. `Mapper layer` (snake→camel, validations)
  4. `Typed Clients` (AuthClient, MessagingClient, StudyGroupsClient)

ITransport
- Interfaz:
  - `request<TResponse = any>(opts: RequestOptions): Promise<{ status: number; data: any; headers: any }>`
  - `getWebSocket(url, opts): IWebSocketClient`

Mapper/Adapter Pattern (Obligatorio)
- Obligación: todos los datos que salen del backend en `shared-api` deben pasar por el `Mapper` antes de ser retornados a callers.
- Implementación:
  - `responseMapper(response, schema?)` → aplica `snakeToCamel` a keys recursivamente y opcionalmente valida con Zod schema.
  - `requestMapper(payload)` → aplica `camelToSnake` para requests enviadas al backend cuando sea necesario.
- Ubicación: dentro de `shared-api/src/mappers/*`.

snake<->camel mapping rules
- Convertir keys recursivamente, mantener arrays, convertir fechas si hay esquema. Mapear `event_date` → `eventDate`, `created_at` → `createdAt`.

Typed Clients
- `AuthClient` API:
  - `getOAuthSignInUrl({ redirectTo }): Promise<string>`
  - `signIn(credentials): Promise<LoginResponse>` // returns camelCase types from `shared-types`
- `MessagingClient` API:
  - `getConversations(params): Promise<Conversation[]>` (camelCase)
  - `sendMessage(conversationId, payload): Promise<Message>`

Patrón Decorator (mensajería) — obligatorio
- El cliente de mensajería no será monolítico. Se divide en:
  - `BaseMessagingClient` (HTTP puro): operaciones REST (`getConversations`, `sendMessage`, `getMessages`, etc.).
  - `RealtimeChatDecorator` (WebSocket + reconexión): envuelve a `BaseMessagingClient` y añade capacidades realtime (`connect`, `subscribe`, `unsubscribe`, `onMessage`, `onPresence`) sin cambiar la API base.
- Composición esperada:
  - `const messaging = new RealtimeChatDecorator(new BaseMessagingClient(transport, mapper), realtimeTransport)`
- Regla:
  - Todo payload entrante del socket pasa por `responseMapper` antes de emitirse al consumidor.

Token Injection & Error Mapping
- Token injection handled by transport middleware: `transport.setAuthProvider(() => authStore.getToken())`.
- `mapHttpErrorToDomain` convierte 4xx/5xx en objetos de error tipados (definidos en `shared-types/errors`).

Runtime validation (opcional ligero)
- Zod schemas pueden usarse en mappers para endpoints críticos (auth, session) para evitar 500s por formatos inesperados. No obligatorio para todos.

4) `shared-ui` — Minimal surface (Auth, Admin, Chat)

Scope mínimo (headless + tokens)
- Exponer:
  - `tokens` (colors, spacing minimal necesarias para Auth/Admin/Chat)
  - `useAuthForm` (hook: common validation + submission wiring)
  - `useModalLogic`, `useChatMessageComposer` (headless hooks)

Presentational components (mínimo)
- Only if strictly blocking UI flows. Each component has two platform files:
  - `Button.web.tsx` (React + Tailwind)
  - `Button.native.tsx` (React Native)
- Prefer headless hooks + platform-specific presentational components.

Platform resolution
- Use file suffixes (`.native.tsx` / `.web.tsx`) and `package.json` exports to allow correct resolution.

5) Integración y despliegue
- Paths/alias: actualizar root `tsconfig.json` con `@uniconnect/*` mappings.
- `pnpm-workspace.yaml` incluirá `packages/*`.
- CI: añadir pipeline step `pnpm -w -r -s run typecheck` (falla si hay errores de tipos).

6) Reglas de desarrollo
- No mocks ni pruebas unitarias nuevas en esta fase.
- Todo runtime mapping snake→camel es responsabilidad de `shared-api`.
- `shared-state` no debe importar `window`/`localStorage` directamente; siempre usar `IStorageAdapter`.

---

## Reglas de Arquitectura y Calidad (obligatorias)

- Principios SOLID aplicados: cada paquete respeta SRP; la inyección de dependencias se usa para invertir dependencias; los módulos altos no dependen de detalles concretos.
- Evitar "Fat Models": los mappers solo transforman y validan; la lógica de negocio va a los casos de uso/servicios fuera de `shared-api` y `shared-state`.

## `shared-types` (nota rápida)

- `shared-types` debe contener interfaces TS y, cuando aplique, Zod schemas ligeros solamente para endpoints críticos (auth, session). Los schemas Zod serán usados por `shared-api` únicamente como validación de seguridad, no como la única fuente de verdad de tipos en tiempo de compilación.

## Mapper: esquema y garantías (detallado)

- Todos los endpoints consumidos por frontends pasan por:
  1. `requestMapper(payload)` — convierte camelCase → snake_case antes de enviar.
  2. Transporte (`ITransport`) — realiza la request.
  3. `responseMapper(rawData, optionalSchema)` — convierte snake_case → camelCase y valida opcionalmente con Zod.

- Garantías del mapper:
  - Ningún campo snake_case debe salir del paquete `shared-api` hacia `shared-state` o vistas.
  - La conversión es recursiva y preserva arrays y tipos primitivos.
  - Las validaciones Zod son opt-in por endpoint y sólo para evitar fallos críticos (ej. sesión, login).

## Realtime (WebSocket) — patrón replicable

- `shared-api` expondrá una abstracción `IRealtime` con:
  - `connect(url, opts): Promise<void>`
  - `on(event: string, handler: (payload) => void)`
  - `off(event, handler)`
  - `send(event, payload)`
  - `close()`

- Reglas:
  - Todos los mensajes entrantes pasan por `responseMapper` antes de emitirse a los listeners (garantía camelCase).
  - Soporte reconexión con backoff, heartbeats, y `subscribe/unsubscribe` by channel id.
  - Reutilizar patrón del chat actual: mensajes, typing, presence events; ampliar para otros eventos domain-specific.

## Patrón Observer (notificaciones) — obligatorio

- El flujo de notificaciones se define con `Observable/Subject` compartido para Web y Mobile.
- Componentes:
  - `NotificationSubject` (en `shared-api` o `shared-state`) actúa como canal central de eventos.
  - Observers de plataforma (`webNotificationObserver`, `mobileNotificationObserver`) se suscriben con la misma firma.
- API sugerida:
  - `subscribe(eventType, handler): UnsubscribeFn`
  - `unsubscribe(eventType, handler): void`
  - `notify(eventType, payload): void`
- Regla de compatibilidad:
  - Web y Mobile consumen exactamente el mismo contrato de suscripción para eventos de socket (chat grupal e individual).

## Design Tokens (consistencia Web + Mobile)

- `packages/shared-ui/src/tokens.ts` (source of truth): exportará valores canónicos (hex colors, spacings as numbers, font sizes as tokens).
- Implementaciones platform-specific:
  - Web: helpers que mapean tokens a `className` y variables CSS (`--uc-primary`), facilitar uso con Tailwind via plugin o utility.
  - Native: helpers que mapean tokens a `StyleSheet` values.
- Regla de oro: UI must consume tokens, not raw literals. Esto asegura paridad visual aunque implementaciones sean nativas o HTML.

