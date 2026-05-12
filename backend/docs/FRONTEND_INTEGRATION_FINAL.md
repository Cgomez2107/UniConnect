# Contrato de Integración Frontend — FRONTEND INTEGRATION FINAL

> **Sprint:** Patrones GoF + Supabase Realtime  
> **Versión:** 1.0 (Cierre de Sprint)  
> **Última actualización:** 2026-05-12

---

## 1. Notificaciones en Tiempo Real (Supabase Realtime)

### 1.1 Canal único

Todas las notificaciones de los servicios **study-groups**, **messaging** y **events** se entregan a través de un único canal Supabase Realtime por usuario:

```
Canal:  user-notifications:{userId}
Formato: broadcast de Supabase Realtime
```

Donde `{userId}` es el UUID del usuario autenticado (el mismo del JWT).

### 1.2 Suscripción desde el Frontend

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,  // anon key, no la service_role
);

function suscribirseNotificaciones(userId: string) {
  const canal = supabase
    .channel(`user-notifications:${userId}`, {
      config: { broadcast: { self: true, ack: false } },
    })
    .on("broadcast", { event: "*" }, (payload) => {
      // payload.type       → "broadcast"
      // payload.event      → tipo de notificación (ej: "solicitud_ingreso", "nuevo_mensaje")
      // payload.payload    → objeto con title, body y metadatos
      manejarNotificacion(payload.event, payload.payload);
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`Conectado a user-notifications:${userId}`);
      }
    });

  return canal;
}
```

### 1.3 Formato del broadcast

```typescript
// Lo que llega en el callback del canal Supabase
interface BroadcastRecibido {
  type: "broadcast";
  event: string;       // tipo de notificación
  payload: PayloadNotificacion;
}

interface PayloadNotificacion {
  title: string;                         // Título mostrable
  body: string;                          // Cuerpo del mensaje
  conversationId?: string;               // Solo en eventos de chat
  messageId?: string;                    // Solo en eventos de chat
  senderId?: string;                     // ID del emisor (chat / eventos)
  requestId?: string;                    // Solo en eventos de study-groups
  applicantId?: string;                  // Solo en solicitudes de ingreso
  transferId?: string;                   // Solo en transferencias
  groupId?: string;                      // Solo en eventos de grupo
  groupName?: string;                    // Solo en eventos de grupo
  [key: string]: unknown;                // Metadatos adicionales
}
```

### 1.4 Mapa de eventos

| `event` (broadcast) | Servicio | `title` (ejemplo) | `body` (ejemplo) |
|---|---|---|---|
| `solicitud_ingreso` | study-groups | "Grupo de Química" | "María quiere unirse a tu grupo." |
| `miembro_aceptado` | study-groups | "Grupo de Química" | "Tu solicitud para Grupo de Química fue aceptada." |
| `miembro_rechazado` | study-groups | "Solicitud rechazada" | "Tu solicitud fue rechazada." |
| `transferencia_admin_solicitada` | study-groups | "Grupo de Química" | "Tienes una solicitud para transferir la administración del grupo." |
| `transferencia_admin_aceptada` | study-groups | "Transferencia aceptada" | "Tu transferencia de administración fue aceptada." |
| `nuevo_mensaje` | messaging | "Juan Pérez" | "Hola, ¿vamos a estudiar?" |

### 1.5 Eventos universitarios (canal separado)

Los eventos universitarios usan un canal independiente con el mismo mecanismo:

```
Canal:  event-notifications:{userId}
event:  "NUEVO_EVENTO"
```

### 1.6 Gestión de suscripciones a eventos

```
POST /api/v1/eventos/suscribir
Content-Type: application/json

{ "category": "SISTEMAS" }

GET /api/v1/eventos/suscripciones

Response: { "userId": "uuid", "categories": ["SISTEMAS", "ARTES"] }
```

Categorías disponibles: `SISTEMAS`, `ARTES`, `MEDICINA`, `DEPORTES`.

---

## 2. Emails (SendGrid Dynamic Templates)

### 2.1 El Frontend NO gestiona plantillas de email

- **El backend (lado servidor) es el único responsable** del diseño, contenido y envío de correos electrónicos.
- El backend usa **SendGrid Dynamic Templates** para los emails institucionales.
- El frontend **no debe** generar ni renderizar HTML de correos, ni invocar APIs de SendGrid directamente.
- El frontend **solo** se entera de que un email fue enviado (o falló) a través del resumen que devuelve `NotificationService`.

### 2.2 Formato del resumen de envío

```typescript
interface ResumenNotificacion {
  total: number;       // canales activos para este usuario
  exitosos: number;    // canales que respondieron OK
  fallidos: number;    // canales que fallaron
  resultados: ResultadoEnvio[];
}

interface ResultadoEnvio {
  canal: string;                          // "email_institucional" | "in_app_websocket" | "push_movil"
  exitoso: boolean;
  error?: string;                         // Solo si falló (ya saneado, sin claves ni URLs)
  timestamp: string;                      // ISO 8601
}
```

### 2.3 Estrategia de canales

| `canal` | Medio | Gestionado por | El Frontend debe... |
|---|---|---|---|
| `in_app_websocket` | Supabase Realtime | Backend + Supabase | Suscribirse al canal `user-notifications:{userId}` |
| `email_institucional` | SendGrid Dynamic Templates | Solo Backend | **No hacer nada** |
| `push_movil` | Push notifications (futuro) | Backend | No implementado aún |

---

## 3. Acciones en Notificaciones (`metadata.action`)

### 3.1 Estándar para botones en la UI

Cuando una notificación incluye el campo `action`, el frontend **debe** renderizar un botón o enlace que lleve al usuario a la URL indicada.

```typescript
interface Accion {
  label: string;     // Texto del botón, listo para mostrar al usuario
  endpoint: string;  // Ruta relativa a la API (o deep link)
  method?: string;   // Método HTTP por defecto "GET"
}
```

### 3.2 Eventos que incluyen `action`

| Evento | `label` | `endpoint` | `method` |
|---|---|---|---|
| `miembro_aceptado` | `"Ver grupo"` | `/api/v1/study-groups/{groupId}` | `GET` |
| `transferencia_admin_solicitada` | `"Revisar solicitud"` | `/api/v1/study-groups/transfers/{transferId}/accept` | `POST` |
| `transferencia_admin_aceptada` | `"Ver grupo"` | `/api/v1/study-groups/{groupId}` | `GET` |

### 3.3 Comportamiento esperado del Frontend

```typescript
function renderizarNotificacion(notificacion: PayloadNotificacion) {
  // El action viaja DENTRO del payload en el broadcast real
  // porque InAppWebSocketStrategy hace spread de payload sobre title/body
  // Sin embargo, el contrato es: si el objeto trae action, se renderiza botón

  if (notificacion.action) {
    const { label, endpoint, method = "GET" } = notificacion.action;
    // Renderizar botón con label
    // Al hacer clic, navegar a endpoint (GET) o enviar POST
  }
}
```

**Nota técnica:** `InAppWebSocketStrategy` hace spread de `payload` sobre `title`/`body`. Si el payload contiene `action`, este aparecerá en el objeto raíz del broadcast. El frontend debe leer `action` tanto del nivel raíz como de `payload.action`.

---

## 4. Errores de API (Chain of Responsibility)

### 4.1 Formato general de error

```json
{
  "name": "NombreDelError",
  "message": "Descripción legible para el usuario.",
  "statusCode": 400,
  "reason": "codigo_maquina"
}
```

### 4.2 Tabla completa de errores de validación

| `name` | `statusCode` | `reason` | `message` (ejemplo) | Causa |
|---|---|---|---|---|
| `DtoValidationError` | `400` | — (usar `fields`) | `"Validation failed"` + `fields: { "conversationId": "conversationId es obligatorio." }` | Campo obligatorio vacío en el DTO |
| `ContentError` | `400` | `"forbidden_words"` | `"Mensaje rechazado: contiene palabras no permitidas."` | El contenido incluye palabras de la lista negra |
| `SizeError` | `400` | `"empty"` | `"Debes enviar texto o una imagen."` | Mensaje sin contenido ni adjunto |
| `SizeError` | `400` | `"max_length"` | `"Mensaje demasiado largo. Máximo 5000 caracteres."` | Excede el límite de caracteres |
| `MediaError` | `400` | `"unsupported_type"` | `"Tipo de archivo no soportado: application/x-msdownload. Permitidos: image/jpeg, image/png, image/gif, image/webp, application/pdf, text/plain"` | Tipo MIME no permitido |
| `MediaError` | `400` | `"filename_too_long"` | `"Nombre de archivo demasiado largo. Máximo 200 caracteres."` | Nombre de archivo excede 200 caracteres |
| `DomainError` | `422` | — | `"La acción 'applyToGroup' no está permitida en el estado 'Cerrada'."` | Operación no válida para el estado actual del grupo |
| `InvalidStateTransitionError` | `422` | — | Mensaje mostrable al usuario | Transición de estado no permitida |
| `Error` genérico | `500` | — | `"Internal server error"` | Error inesperado del servidor |

### 4.3 MIME types permitidos para archivos adjuntos

```
image/jpeg
image/png
image/gif
image/webp
application/pdf
text/plain
```

Cualquier otro tipo MIME será rechazado con `MediaError` / `"unsupported_type"`.

### 4.4 Límites de validación

| Regla | Valor |
|---|---|
| Longitud máxima del mensaje | 5000 caracteres |
| Longitud máxima del nombre de archivo | 200 caracteres |
| Tipos MIME permitidos | 6 (ver sección 4.3) |

### 4.5 Estrategia de manejo en el Frontend

```typescript
async function handleApiError(response: Response): Promise<void> {
  if (response.ok) return;

  const body: ApiError = await response.json();

  switch (body.name) {
    case "DtoValidationError":
      showFieldErrors(body.fields);
      break;

    case "ContentError":
      showToast("El mensaje contiene palabras no permitidas.", "warning");
      break;

    case "SizeError":
      if (body.reason === "empty") {
        showToast("Debes escribir un mensaje o adjuntar un archivo.", "warning");
      } else if (body.reason === "max_length") {
        showToast(`Máximo ${body.maxLength} caracteres.`, "warning");
      }
      break;

    case "MediaError":
      if (body.reason === "unsupported_type") {
        showToast("Tipo de archivo no soportado.", "warning");
      } else if (body.reason === "filename_too_long") {
        showToast("Nombre de archivo demasiado largo.", "warning");
      }
      break;

    case "DomainError":
    case "InvalidStateTransitionError":
      showToast(body.message, "info");
      break;

    default:
      showToast("Error inesperado. Intenta de nuevo.", "error");
  }
}
```

---

## 5. Resumen de Endpoints del Gateway

| Ruta | Servicio | Auth |
|---|---|---|
| `GET /health` | Gateway | No |
| `/api/v1/auth/*` | Auth | No |
| `/api/v1/study-groups*` | Study Groups | JWT |
| `/api/v1/notifications*` | Study Groups | JWT |
| `/api/v1/resources*` | Resources | JWT |
| `/api/v1/conversations*` | Messaging | JWT |
| `/api/v1/messages*` | Messaging | JWT |
| `/api/v1/students*` | Profiles Catalog | JWT |
| `/api/v1/catalog*` | Profiles Catalog | JWT |
| `/perfil*` | Profiles Catalog | JWT |
| `/api/v1/events*` | Events | JWT |
| `/api/v1/eventos/suscribir` | Events | JWT |
| `/api/v1/eventos/suscripciones` | Events | JWT |

---

## 6. Perfil de Estudiante (Decorador D02)

```
GET /perfil/{studentId}[?vista=completa]
GET /api/v1/students/{studentId}[?vista=completa]
```

### Perfil base (sin `?vista=completa`)

```json
{
  "data": {
    "id": "uuid",
    "fullName": "María García",
    "avatarUrl": null,
    "programName": "Ingeniería de Sistemas",
    "semester": 5,
    "sharedSubjects": [
      { "id": "mat-101", "name": "Matemáticas I" }
    ]
  }
}
```

### Perfil decorado (`?vista=completa`)

```json
{
  "data": {
    "id": "uuid",
    "fullName": "María García",
    "avatarUrl": null,
    "carrera": "Ingeniería de Sistemas",
    "semestre": 5,
    "asignaturasActivas": [
      { "id": "mat-101", "name": "Matemáticas I" }
    ],
    "indicadores": {
      "gruposCreados": 3,
      "gruposParticipa": 5,
      "mensajesEnviados": 127
    },
    "insignias": [
      {
        "id": "badge-001",
        "nombre": "Colaborador",
        "descripcion": "Has participado en más de 5 grupos",
        "iconoUrl": "https://...",
        "fechaObtenida": "2026-03-15T10:30:00Z"
      }
    ]
  }
}
```

**Degradación graceful:** Si el repositorio de indicadores falla, el servidor retorna únicamente los datos base con status `200`. El frontend debe esperar que `indicadores` e `insignias` puedan no estar presentes.

---

## 7. Tipos TypeScript para el Frontend

```typescript
// ─── Supabase Realtime ──────────────────────────────────────
interface BroadcastNotificacion {
  type: "broadcast";
  event: string;
  payload: PayloadNotificacion;
}

interface PayloadNotificacion {
  title: string;
  body: string;
  action?: Accion;
  [key: string]: unknown;
}

// ─── Acciones ────────────────────────────────────────────────
interface Accion {
  label: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

// ─── Errores de API ──────────────────────────────────────────
type ApiError =
  | DtoValidationError
  | ContentError
  | SizeError
  | MediaError
  | DomainError
  | { name: string; message: string; statusCode: number };

interface DtoValidationError {
  name: "DtoValidationError";
  message: "Validation failed";
  statusCode: 400;
  fields: Record<string, string>;
}

interface ContentError {
  name: "ContentError";
  message: string;
  statusCode: 400;
  reason: "forbidden_words";
}

interface SizeError {
  name: "SizeError";
  message: string;
  statusCode: 400;
  reason: "empty" | "max_length";
  maxLength?: number;
}

interface MediaError {
  name: "MediaError";
  message: string;
  statusCode: 400;
  reason: "unsupported_type" | "filename_too_long";
}

interface DomainError {
  name: "DomainError" | "InvalidStateTransitionError";
  message: string;
  statusCode: 422;
}

// ─── Perfil ──────────────────────────────────────────────────
interface ProfileBase {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  carrera: string;
  semestre: number | null;
  asignaturasActivas: Array<{ id: string; name: string }>;
}

interface ProfileDecorated extends ProfileBase {
  indicadores?: {
    gruposCreados: number;
    gruposParticipa: number;
    mensajesEnviados: number;
  };
  insignias?: Array<{
    id: string;
    nombre: string;
    descripcion: string;
    iconoUrl: string;
    fechaObtenida: string;
  }>;
}

// ─── Eventos universitarios ──────────────────────────────────
type EventCategory = "SISTEMAS" | "ARTES" | "MEDICINA" | "DEPORTES";

interface EventSubscriptionRequest {
  category: EventCategory;
}

interface EventSubscriptionResponse {
  userId: string;
  categories: EventCategory[];
}
```

---

## 8. Seguridad y Saneamiento

- **API keys y tokens:** Cualquier mensaje de error que contenga una clave SendGrid (`SG.xxx`), una URL (`https://...`) o una ruta de archivo (`C:\...` o `/unix/path`) es automáticamente redactado por `sanitizeError()` antes de llegar al frontend.
- **Resolución de destinatarios:** El backend consulta la tabla `profiles` antes de emitir cualquier notificación. Si el usuario no existe o no tiene email/token, la notificación se descarta silenciosamente.

---

## 9. Checklist de Integración para el Frontend

- [ ] Suscribirse al canal `user-notifications:{userId}` al iniciar sesión
- [ ] Desuscribirse al cerrar sesión
- [ ] Renderizar botón cuando `action` está presente en la notificación
- [ ] Usar `body.name` para switchear el manejo de errores HTTP 400/422
- [ ] No cachear `?vista=completa` del perfil agresivamente
- [ ] No intentar renderizar ni diseñar emails (responsabilidad del backend)
- [ ] Leer `action` tanto del nivel raíz como de `payload.action` en broadcasts
