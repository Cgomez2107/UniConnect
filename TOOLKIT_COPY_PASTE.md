# TOOLKIT - COPY & PASTE DIRECTO

## MAPEO TAREAS → US → RAMA → COMMIT → PROMPT

---

# US-W01 · Autenticacion institucional en el dashboard web | RICE: 12

## Rama: feat/us-w01-institutional-auth

### Tarea 01: Definir rutas publicas/privadas del dashboard (Sofia)

**Commit:** feat(frontend): implement public/private route separation
**Scope:** frontend(routing)
**Prompt:**

```
Crea un sistema de routing que separe rutas públicas (login) de privadas (dashboard).
- Rutas públicas: /login
- Rutas privadas: /dashboard, /grupos, /chat
- Guard central que redirige automáticamente si no hay sesión
- Metadata public/private en cada ruta
- Si usuario no autenticado intenta acceder a privada → redirige a login
- Si usuario autenticado intenta acceder a login → redirige a dashboard
```

---

### Tarea 02: Crear AuthButton desacoplado (Sofia)

**Commit:** feat(frontend): implement reusable AuthButton component
**Scope:** frontend(components-auth)
**Prompt:**

```
Crea componente AuthButton reutilizable para OAuth:
- Estados: idle, loading, error
- Props: onSuccess(token), onError(error), provider (google/microsoft)
- Sin lógica de pantalla, solo UI + callbacks
- Compatible con login y re-autenticación
- Incluye estados visuales de error
```

---

### Tarea 03: Implementar SessionGuard por ruta (Sofia)

**Commit:** feat(frontend): implement SessionGuard for route protection
**Scope:** frontend(guards)
**Prompt:**

```
Crea SessionGuard que verifica sesión antes de renderizar rutas privadas:
- Wrapper de rutas privadas
- Spinner de carga/hidratación mientras verifica sesión
- Mantiene sesión en localStorage/cookie
- Al refrescar, restaura sesión y redirige a ruta original
- Fallback a login si no hay sesión válida
```

---

### Tarea 04: Pruebas QA del flujo completo login (Natalia)

**Commit:** test(qa): QA test matrix for complete login flow
**Scope:** qa(login-flow)
**Prompt:**

```
Crea matriz de pruebas QA para login:
Casos:
1. Login exitoso: usuario → password correcto → dashboard
2. Login inválido: usuario → password incorrecto → error visible
3. Token vencido: al hacer acción → re-login automático
4. Logout: usuario → botón logout → sesión destruida, redirect login
Evidencia requerida: screenshots/logs por caso en web y mobile
```

---

# US-W02 · Panel de administracion de grupo de estudio | RICE: 12

## Rama: feat/us-w02-admin-panel

### Tarea 05: Crear MemberList independiente (Sofia)

**Commit:** feat(frontend): implement standalone MemberList component
**Scope:** frontend(components-admin)
**Prompt:**

```
Crea componente MemberList desacoplado:
- Lista de miembros del grupo
- Columnas: nombre, email, rol, estado (activo/invitado/removido)
- Sin lógica de aceptar/rechazar, solo display
- Compatible con datos mock y reales
- Soporte para scroll/virtualizacion en listas grandes
```

---

### Tarea 06: Crear PendingApplicationsList independiente (Sofia)

**Commit:** feat(frontend): implement standalone PendingApplicationsList
**Scope:** frontend(components-admin)
**Prompt:**

```
Crea componente PendingApplicationsList desacoplado:
- Lista de solicitudes pendientes
- Columnas: solicitante, email, fecha solicitud, acciones (aceptar/rechazar)
- Estados visuales: empty (sin solicitudes), loading, error
- Sin lógica de backend, solo UI
- Acciones como callbacks (onAccept, onReject)
```

---

### Tarea 07: Implementar acciones Aceptar/Rechazar (Sofia)

**Commit:** feat(frontend): implement accept/reject application actions
**Scope:** frontend(use-cases-admin)
**Prompt:**

```
Conecta botones Aceptar/Rechazar a endpoints:
- onAccept(applicationId) → PUT /groups/{id}/applications/{appId}/accept
- onReject(applicationId) → PUT /groups/{id}/applications/{appId}/reject
- Actualización optimista: cambiar estado en UI antes de confirmar
- Si error, rollback al estado anterior
- Toast/feedback visual del resultado
```

---

### Tarea 08: Implementar TransferAdminModal (Sofia)

**Commit:** feat(frontend): implement TransferAdminModal with double confirmation
**Scope:** frontend(components-admin)
**Prompt:**

```
Crea modal para transferir admin:
- Busca miembro en lista filtrable
- Confirmar → modal de confirmación doble ("¿Estás seguro?")
- POST /groups/{id}/transfer-admin {newAdminId}
- Actualiza UI: nuevo admin tiene badge, antiguo lo pierde
- Estados: idle, loading, error
```

---

### Tarea 09: Validar conflicto por limite de grupo y error 23505 (Carlos) → **US-W02**

**Commit:** feat(study-groups): handle PostgreSQL 23505 unique constraint error
**Scope:** study-groups(errors)
**Prompt:**

```
Mapea error DB 23505 a mensaje legible:
- Error code 23505 = unique constraint violation (límite de grupos)
- En PostgresStudyRequestRepository.createStudyRequest()
- catch error: if error.code === '23505' → throw new BusinessError("Has alcanzado el límite de grupos activos que puedes crear")
- Frontend recibe mensaje claro en español, no error genérico 500
```

---

### Tarea 10: Pruebas QA del panel admin (Natalia)

**Commit:** test(qa): QA regression tests for admin panel
**Scope:** qa(admin-panel)
**Prompt:**

```
Crea checklist QA del panel admin:
Casos:
1. Listar solicitudes: muestra datos correctos, paginación funciona
2. Aceptar solicitud: estado cambia, miembro aparece en lista
3. Rechazar solicitud: solicitud desaparece
4. Transferir admin: nuevo admin tiene permisos, antiguo los pierde
5. Permisos: usuario no-admin no puede acceder a panel
Evidencia: screenshots de cada caso
```

---

# US-INF01 · Dockerizacion del backend Node.js | RICE: 11

## Rama: feat/us-inf01-dockerfile-setup

### Tarea 12: Ajuste de etapa builder para compilacion limpia (Carlos)

**Commit:** feat(docker): optimize builder stage for reproducible compilation
**Scope:** docker(backend-builder)
**Prompt:**

```
Configura etapa builder del Dockerfile.dev/Dockerfile:
- Base: node:20-alpine
- Instala pnpm
- Copia package.json, pnpm-lock.yaml, pnpm-workspace.yaml
- pnpm install --frozen-lockfile (instalación determinista)
- Copia código fuente
- tsc -p tsconfig.json (compila TS a JS)
- Cache eficiente: capas por instalación vs código
```

---

### Tarea 13: Ajuste de etapa runner minima en Alpine (Carlos)

**Commit:** feat(docker): create minimal runner stage in Alpine
**Scope:** docker(backend-runner)
**Prompt:**

```
Crea etapa runner minimalista:
- Base: node:20-alpine
- Copia solo: dist/, node_modules/ (prod), package.json
- NO copiar: src/, tsconfig.json, .ts files
- Comando: node dist/index.js
- Exposer puerto (3000 o variable)
- Verificar reducción de tamaño (builder vs runner)
```

---

### Tarea 14: Validacion de dockerignore backend (Carlos)

**Commit:** feat(docker): add comprehensive .dockerignore for backend
**Scope:** docker(config)
**Prompt:**

```
Crea .dockerignore para excluir:
- node_modules/
- dist/
- *.env
- .git/
- .gitignore
- README.md
- *.md
- .turbo/
- .vscode/
- test/
- coverage/
Verifica que build context sea pequeño (<500MB)
```

---

# US-INF02 · Dockerizacion del dashboard web (React) | RICE: 11

## Rama: feat/us-inf02-dockerfile-frontend

### Tarea 17: Implementacion de builder para build de produccion web (Sofia)

**Commit:** feat(docker): implement production builder stage for frontend
**Scope:** docker(frontend-builder)
**Prompt:**

```
Configura builder para frontend:
- Base: node:20-alpine
- Copia package.json, package-lock.json
- npm ci --prefer-offline
- Copia código fuente
- npm run build (genera dist/)
- Sin warnings críticos
- Verifica que dist/ sea generado correctamente
```

---

### Tarea 18: Implementacion de runner con Nginx en puerto 80 (Sofia)

**Commit:** feat(docker): implement Nginx runner stage for frontend
**Scope:** docker(frontend-runner)
**Prompt:**

```
Crea runner con Nginx:
- Base: nginx:alpine
- Copia dist/ desde builder → /usr/share/nginx/html
- Copia nginx.conf personalizado
- Expone puerto 80
- Verifica: localhost/index.html → 200 OK
```

---

### Tarea 19: Configuracion de rutas SPA con fallback a index (Sofia)

**Commit:** feat(docker): configure Nginx SPA routing with index.html fallback
**Scope:** docker(frontend-config)
**Prompt:**

```
Configura nginx.conf para SPA:
- location / { try_files $uri $uri/ /index.html; }
- Permite rutas profundas sin 404
- Caching de assets estáticos (CSS, JS, imágenes)
- No cachear index.html
Verifica: /dashboard → carga index.html (no 404)
```

---

### Tarea 20: Verificacion de variables frontend de build (Sofia)

**Commit:** feat(docker): validate build-time variables for frontend
**Scope:** docker(frontend-config)
**Prompt:**

```
Valida variable VITE_API_URL:
- En build: verificar que VITE_API_URL esté definida
- Si falta → npm run build falla con error claro
- Si existe → incluirla en dist/
- Soportar .env.production
- No hardcodear localhost en build
```

---

# US-INF03 · docker-compose para entorno de desarrollo local | RICE: 11

## Rama: feat/us-inf03-docker-compose-setup

### Tarea 22: Ajuste de servicios backend/frontend/db en compose (Carlos)

**Commit:** feat(docker-compose): define backend, frontend, and DB services
**Scope:** docker-compose(services)
**Prompt:**

```
Configura servicios en docker-compose.yml:
Servicios:
1. db: postgres:16-alpine
   - PORT: 5432
   - POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
   - Health check: pg_isready
2. backend: build: ./backend, Dockerfile.dev
   - PORT: 3000
   - Depende de: db (depends_on)
3. frontend: build: ./frontend, Dockerfile.dev
   - PORT: 3001 o 5173 (Vite)
   - Depende de: backend
Networks: uniconnect-network
```

---

### Tarea 23: Configuracion de hot-reload backend por volumen (Carlos)

**Commit:** feat(docker-compose): add hot-reload volumes for backend
**Scope:** docker-compose(volumes)
**Prompt:**

```
Monta volúmenes para hot-reload:
- ./backend/services:/app/services
- ./backend/shared:/app/shared
- ./backend/gateway:/app/gateway
Comando: pnpm dev (ejecuta tsx --watch)
Verifica: cambiar archivo .ts → servidor reinicia automáticamente
```

---

### Tarea 24: Persistencia de db con volumen nombrado (Carlos)

**Commit:** feat(docker-compose): add named volume for DB persistence
**Scope:** docker-compose(volumes)
**Prompt:**

```
Configura persistencia de DB:
- volumes: dbdata (volumen nombrado)
- db service: volumes: [dbdata:/var/lib/postgresql/data]
Verifica: docker-compose down && docker-compose up
- Datos persisten (tablas, registros)
```

---

### Tarea 25: Actualizacion de env.example (Carlos)

**Commit:** feat(docker-compose): document environment variables in .env.example
**Scope:** docker-compose(config)
**Prompt:**

```
Crea .env.example con:
# Database
DB_NAME=uniconnect_dev
DB_USER=postgres
DB_PASSWORD=postgres_password_dev
DB_HOST=db (nombre del servicio)
DB_PORT=5432

# JWT
JWT_ACCESS_SECRET=dev_secret_access
JWT_REFRESH_SECRET=dev_secret_refresh

# Frontend
VITE_API_URL=http://localhost:3000

# Node
NODE_ENV=development

SIN SECRETOS REALES - solo ejemplos
```

---

# US-T01 · Unit tests para el patron Decorator | RICE: 10

## Rama: feat/us-t01-decorator-unit-tests

### Tarea 28: Preparacion de suite de pruebas para decoradores (Natalia)

**Commit:** test(decorators): setup test infrastructure for decorator pattern
**Scope:** backend/services/messaging(tests)
**Prompt:**

```
Estructura base para tests:
- backend/services/messaging/src/__tests__/
- decorators/ carpeta
- fixtures/ (datos mock)
- utilidades: describe, it, expect (vitest o jest)
- Setup global: beforeEach, afterEach
- Mocks: BaseMessage, FileDecorator, etc.
Verifica: pnpm test ejecuta suite sin errores
```

---

### Tarea 29: Tests de MensajeBase (Natalia)

**Commit:** test(decorators): add unit tests for BaseMessage
**Scope:** backend/services/messaging(tests)
**Prompt:**

```
Tests para BaseMessage:
Casos positivos:
1. Crear mensaje base: verifica id, content, timestamp, senderId
2. toJSON(): retorna {id, content, timestamp ISO, senderId}

Casos negativos:
3. id vacío → error
4. content vacío → error
5. timestamp invalido → error

Cobertura: 100% de la clase
```

---

### Tarea 30: Tests de MensajeConArchivo (Natalia)

**Commit:** test(decorators): add unit tests for FileDecorator
**Scope:** backend/services/messaging(tests)
**Prompt:**

```
Tests para FileDecorator:
Casos:
1. Crear FileDecorator sobre BaseMessage
2. toJSON() incluye: {file: {filename, size, mimeType, url}}
3. Validaciones:
   - filename vacío → error
   - size > 100MB → error
   - mimeType inválido → error
   - url vacío → error
4. Snapshot: shape del payload es consistente
```

---

### Tarea 31: Tests de mencion, reaccion y composicion encadenada (Natalia)

**Commit:** test(decorators): add unit tests for MentionDecorator and ReactionDecorator
**Scope:** backend/services/messaging(tests)
**Prompt:**

```
Tests para composición:
MentionDecorator:
1. toJSON() incluye: {mentions: [{userId, displayName, position}]}
2. isMentioned("user-1") → true/false
3. Sin duplicados de userId

ReactionDecorator:
1. toJSON() incluye: {reactions: [...]}
2. addReaction("👍", "user-1") → incrementa count
3. removeReaction("👍", "user-1") → decrementa

Encadenado:
4. BaseMessage → File → Mention → Reaction
5. toJSON() final contiene todos los campos
```

---

# US-T02 · Unit tests para el patron Observer | RICE: 10

## Rama: feat/us-t02-observer-unit-tests

### Tarea 32: Mocks de Subject y Observer (Natalia)

**Commit:** test(observers): create reusable mocks for Subject and Observer
**Scope:** backend/services(tests)
**Prompt:**

```
Crea mocks reutilizables:
- MockSubject: implementa ISubject (o ChatSubject)
- MockObserver: implementa IChatObserver/IObserver
- MockIdempotencyStore: implementa IIdempotencyStore
- MockRealtimeService: implementa IRealtimeService
- Fixtures: eventos tipados (INewMessageEvent, etc.)

No depender de servicios reales → pruebas aisladas
```

---

### Tarea 33: Tests de suscripcion y notificacion multiple (Natalia)

**Commit:** test(observers): add unit tests for subscription and notification
**Scope:** backend/services(tests)
**Prompt:**

```
Tests para subscribe/emit:
1. Observer se suscribe → recibe eventos
2. Múltiples observers → todos reciben (fan-out)
3. Observer específico recibe solo eventos de su canal
4. emit(channel) → solo observers del canal notificados
5. Cambios de estado en observers se reflejan
```

---

### Tarea 34: Tests de desuscripcion (Natalia)

**Commit:** test(observers): add unit tests for unsubscribe
**Scope:** backend/services(tests)
**Prompt:**

```
Tests para desuscripción:
1. Observer se desuscribe → no recibe nuevos eventos
2. Después de unsubscribe, lista de observers es más pequeña
3. Eventos siguen llegando a otros observers
4. Llamadas a observer removido = 0
```

---

### Tarea 35: Test de aislamiento ante fallo de un observer (Natalia)

**Commit:** test(observers): add resilience tests for observer failures
**Scope:** backend/services(tests)
**Prompt:**

```
Tests de resiliencia:
1. Observer 1 falla (throw error)
2. Observer 2 sigue recibiendo evento
3. Subject no interrumpe notificaciones por fallos
4. Errores se loguean pero no propagan
5. Promise.allSettled() maneja fallos correctamente
```

---

# US-W03 · Vista del chat grupal en el dashboard | RICE: 8

## Rama: feat/us-w03-group-chat-view

### Tarea 36: Componente MessageList desacoplado (Sofia)

**Commit:** feat(frontend): implement standalone MessageList component
**Scope:** frontend(components-chat)
**Prompt:**

```
Crea MessageList desacoplado:
- Lista de mensajes del grupo
- Virtualizacion para rendimiento (listas grandes)
- Scroll automático al nuevo mensaje
- Sin lógica de envio, solo display
- Props: messages[], isLoading, hasMore
- Callbacks: onLoadMore()
```

---

### Tarea 37: Componente MessageBubble desacoplado por tipo (Sofia)

**Commit:** feat(frontend): implement MessageBubble with type variants
**Scope:** frontend(components-chat)
**Prompt:**

```
Crea MessageBubble con variantes:
Tipos de mensaje:
1. Texto puro: {id, content, senderId, timestamp}
2. Con archivo: {file: {filename, url, size, type}}
3. Con menciones: {mentions: [{name, position}]}
4. Con reacciones: {reactions: [{emoji, count, users}]}

Renderiza correctamente cada tipo
Estilos distintos por tipo
```

---

### Tarea 38: Componente ChatInput desacoplado (Sofia)

**Commit:** feat(frontend): implement standalone ChatInput component
**Scope:** frontend(components-chat)
**Prompt:**

```
Crea ChatInput desacoplado:
- Input de texto
- Botón de archivo (adjuntar)
- Botón de envio
- Indicador de menciones (@usuario)
- Estados: idle, loading (enviando), error
- Callbacks: onSend({content, file, mentions})
- No UI bloqueada durante envío
- Clear input después de envío exitoso
```

---

# US-O01 · Observer para eventos del grupo de estudio | RICE: 8

## Rama: feat/us-o01-observer-pattern-groups

### Tarea 41: Contrato de evento tipado para dominio de grupo (Carlos)

**Commit:** feat(study-groups): define typed event contracts for group domain
**Scope:** study-groups(domain-events)
**Prompt:**

```
Define tipos de eventos para grupo:
1. IGroupCreatedEvent
2. IGroupUpdatedEvent
3. IMemberAddedEvent
4. IMemberRemovedEvent
5. IGroupDeletedEvent

Cada evento:
{
  type: string,
  timestamp: Date,
  groupId: string,
  userId: string,
  data: unknown
}

Export union type: StudyGroupEvent
```

---

### Tarea 42: Implementacion de Subject para eventos de grupo (Carlos)

**Commit:** feat(study-groups): implement StudyGroupSubject for event handling
**Scope:** study-groups(domain-events)
**Prompt:**

```
Crea StudyGroupSubject:
- subscribe(observer)
- unsubscribe(observer)
- emit(event)

Almacena observers en Set
emit() es asincrónico con Promise.allSettled()
Maneja fallos de observers sin interrumpir otros
Loguea errores
```

---

### Tarea 43: Observer de persistencia de notificaciones (Carlos)

**Commit:** feat(study-groups): implement NotificationObserver for event persistence
**Scope:** study-groups(domain-events)
**Prompt:**

```
Crea NotificationObserver implementando IObserver:
- handle(event: StudyGroupEvent)
- Parsea type del evento
- Llama a repository.createNotification() con datos
- Soporta 5 tipos de eventos
- Maneja errores y loguea
- Integra en main.ts: subject.subscribe(notificationObserver)
```

---

# US-O02 · Observer para mensajes del chat en tiempo real | RICE: 8

## Rama: feat/us-o02-observer-pattern-chat

### Tarea 45: Implementacion de ChatSubject para nuevo mensaje (Carlos)

**Commit:** feat(messaging): implement ChatSubject with channel-based routing
**Scope:** messaging(domain-events)
**Prompt:**

```
Crea ChatSubject con soporte de canales:
- channels: Map<ChatChannel, Set<IChatObserver>>
- subscribe(channel, observer)
- unsubscribe(channel, observer)
- emit(channel, event)

Solo observers del canal reciben evento
Previene "message leakage" entre canales
```

---

### Tarea 46: Separacion de canales grupo y DM (Carlos)

**Commit:** feat(messaging): implement channel routing for groups and DMs
**Scope:** messaging(domain-events)
**Prompt:**

```
Define helpers de canal:
- createGroupChannel(groupId): "grupo:{groupId}"
- createDMChannel(user1, user2): "dm:{sortedIds}"
  * Siempre lexicográfico: ("bob", "alice") = "dm:alice:bob"

Garantiza consistencia de canal para DMs
Evita duplicación de canales
```

---

### Tarea 47: Proteccion contra doble emision en reintentos (Carlos)

**Commit:** feat(messaging): add idempotency and realtime observers
**Scope:** messaging(domain-events)
**Prompt:**

```
Crea 2 observers:

IdempotencyObserver:
- Implementa IChatObserver
- Usa IIdempotencyStore.markProcessed(messageId)
- Si retorna false (duplicado) → ignora
- Si retorna true (nuevo) → procesa

RealtimeObserver:
- Implementa IChatObserver
- Usa IRealtimeService.broadcast(channel, message)
- Emite a WebSocket
```

---

# US-INF04 · Deploy del backend en Fly.io | RICE: 8

## Rama: feat/us-inf04-deploy-backend-flyio

### Tarea 49: Validacion de secrets en Fly.io y revision de configuracion (Natalia)

**Commit:** devops(flyio): validate secrets and deployment configuration
**Scope:** devops(flyio)
**Prompt:**

```
Audita Fly.io:
- Verificar que fly.toml está configurado
- Revisar que secrets NO están en el repo
- Usar fly secrets set VAR=value para secretos
- Checklist:
  ✓ DATABASE_URL en secrets
  ✓ JWT_ACCESS_SECRET en secrets
  ✓ JWT_REFRESH_SECRET en secrets
  ✓ Sin hardcoding en código
```

---

### Tarea 50: Prueba de health check del backend desplegado (Natalia)

**Commit:** devops(flyio): validate deployed backend health check
**Scope:** devops(flyio)
**Prompt:**

```
Verifica health del backend:
- curl https://backend.fly.dev/health
- Debe retornar 200 OK
- Status: {"status": "ok", "timestamp": ...}
- Health estable tras restart/deploy
- Monitora en Fly.io dashboard
```

---

### Tarea 51: Validacion de flujo auth contra backend desplegado y documentacion de URL publica (Natalia)

**Commit:** devops(flyio): validate auth flow and document public URLs
**Scope:** devops(flyio-docs)
**Prompt:**

```
Prueba auth en producción:
- POST https://backend.fly.dev/auth/login
- Retorna token válido
- Token funciona en endpoints protegidos
- Actualiza README.md con URLs públicas:
  * Backend: https://backend.fly.dev
  * Frontend: https://frontend.fly.dev
```

---

# US-INF05 · Deploy del dashboard web en Fly.io | RICE: 8

## Rama: feat/us-inf05-deploy-frontend-flyio

### Tarea 52: Revision de configuracion Fly.io del frontend y validacion de VITE_API_URL (Natalia)

**Commit:** devops(flyio): validate frontend Fly.io configuration and VITE_API_URL
**Scope:** devops(flyio)
**Prompt:**

```
Configura frontend en Fly.io:
- fly.toml apunta a dist/
- Build command: npm run build
- Verifica que VITE_API_URL apunta a backend real
  * Producción: VITE_API_URL=https://backend.fly.dev
  * NO localhost
- Build falla si VITE_API_URL falta
```

---

### Tarea 53: Prueba de carga publica del dashboard (Natalia)

**Commit:** test(e2e): smoke test for public dashboard deployment
**Scope:** qa(deployment)
**Prompt:**

```
Prueba de humo:
- curl https://frontend.fly.dev
- Retorna HTML (200 OK)
- Carga index.html
- Assets cargan: CSS, JS, imágenes
- Tiempos de carga aceptables (<3s)
```

---

### Tarea 54: Prueba end-to-end login -> grupos -> chat en produccion (Natalia)

**Commit:** test(e2e): complete flow E2E test in production
**Scope:** qa(e2e)
**Prompt:**

```
E2E completo en producción:
1. Abrir https://frontend.fly.dev
2. Click login → redirige a auth
3. Autenticar → retorna token
4. Dashboard carga → lista grupos
5. Click grupo → vista grupo
6. Click chat → enviar mensaje
7. Mensaje aparece en tiempo real

Evidencia: screenshots de cada paso
Sin fallback a localhost
```

---

# US-D01 · Decorator de mensajes del chat grupal | RICE: 6

## Rama: feat/us-d01-decorator-pattern

### Tarea 55: Crear interfaz base de mensaje y clase base (Carlos)

**Commit:** feat(messaging): implement IMessage interface and BaseMessage class
**Scope:** messaging(domain-decorators)
**Prompt:**

```
Define IMessage:
- id: string (readonly)
- content: string (readonly)
- timestamp: Date (readonly)
- senderId: string (readonly)
- toJSON(): Record<string, unknown>

Implementa BaseMessage que cumple IMessage:
- Constructor con los 4 campos
- toJSON() retorna {id, content, timestamp: ISO, senderId}
```

---

### Tarea 56: Implementar decorador de archivo (Carlos)

**Commit:** feat(messaging): implement FileDecorator for message attachments
**Scope:** messaging(domain-decorators)
**Prompt:**

```
Crea FileDecorator extendiéndolo de MessageDecorator:
- Agrega FileMetadata {filename, size, mimeType, url}
- Validaciones:
  ✓ filename no vacío
  ✓ 0 < size <= 100MB
  ✓ mimeType válido
  ✓ url presente
- getFile()
- toJSON() → {...super.toJSON(), file: {...}}
```

---

### Tarea 57: Implementar decorador de mencion (Carlos)

**Commit:** feat(messaging): implement MentionDecorator for user mentions
**Scope:** messaging(domain-decorators)
**Prompt:**

```
Crea MentionDecorator extendiéndolo de MessageDecorator:
- Agrega Mention[] {userId, displayName, position}
- Validaciones:
  ✓ No hay duplicados de userId
  ✓ Campos no vacíos
  ✓ Position >= 0
- getMentions()
- isMentioned(userId): boolean
- toJSON() → {...super.toJSON(), mentions: [...]}
```

---

### Tarea 58: Implementar decorador de reaccion e integracion final (Carlos)

**Commit:** feat(messaging): implement ReactionDecorator and finalize decorator chain
**Scope:** messaging(domain-decorators)
**Prompt:**

```
Crea ReactionDecorator extendiéndolo de MessageDecorator:
- Almacena Reaction Map {emoji → {count, users[]}}
- Validaciones:
  ✓ count === users.length
  ✓ No usuarios duplicados por emoji
- getReactions()
- getReaction(emoji)
- addReaction(emoji, userId)
- removeReaction(emoji, userId)
- toJSON() → {...super.toJSON(), reactions: [...]}

Cadena completa: BaseMessage → File → Mention → Reaction
```

---

### Tarea 39: Ajuste backend para emitir payload decorado final (Carlos) → **US-D01**

**Commit:** feat(messaging): integrate decorators into SendMessage use case
**Scope:** messaging(use-cases)
**Prompt:**

```
En SendMessage.execute():
1. Crear BaseMessage {id, content, timestamp, senderId}
2. Si input.file → FileDecorator
3. Si input.mentions → MentionDecorator
4. Guardar en DB
5. Emitir a ChatSubject:
   - canal = createGroupChannel(input.groupId)
   - evento = {type: "message.new", payload: message.toJSON()}
   - chatSubject.emit(canal, evento)

Payload final incluye: {id, content, file?, mentions?, reactions?}
```

---

# US-W05 · Centro de notificaciones en tiempo real | RICE: 2

## Rama: feat/us-w05-notification-center

### Tarea 40: Prueba QA de realtime, orden y render (Natalia)

**Commit:** test(qa): QA tests for realtime messaging and ordering
**Scope:** qa(messaging)
**Prompt:**

```
Tests QA de chat real-time:
1. Enviar mensaje → aparece en el otro usuario en < 1s
2. Orden: mensajes en orden cronológico
3. No duplicados: retransmisión no crea duplicados
4. Render: cada tipo de mensaje (file, mention, reaction) renderiza bien
5. Casos: offline/online transitions

Evidencia: timestamps, screenshots
```

---

### Tarea 44: Prueba QA de emision y consumo de evento (Natalia)

**Commit:** test(qa): QA E2E tests for event emission and consumption
**Scope:** qa(events)
**Prompt:**

```
Tests E2E de eventos grupo:
1. Crear grupo → GroupCreatedEvent emitido → NotificationObserver persiste
2. Agregar miembro → MemberAddedEvent → notificación creada
3. Remover miembro → MemberRemovedEvent → notificación creada
4. Cambiar nombre grupo → GroupUpdatedEvent → notificación creada
5. Eliminar grupo → GroupDeletedEvent → notificación creada

Verifica: eventos → observadores → base de datos
```

---

# RESUMEN COPY-PASTE

Para tu toolkit, copia y pega por secciones:

1. Selecciona la US que quieres
2. Copia la rama
3. Copia cada tarea con: Commit + Scope + Prompt
4. Pega en tu herramienta

**Total:** 59 tareas × 22 US mapeadas
**Commits:** Uno por tarea (nombre consistente)
**Prompts:** Listos para copiar a IA
**Ramas:** Claras por US
