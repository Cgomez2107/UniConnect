# Auditoría US-O03: Suscripción a Categorías de Eventos

> **Auditor:** QA Automation Engineer Senior  
> **Servicio:** `backend/services/events`  
> **Patrón:** Observer  
> **Fecha:** 2026-05-12  

---

## Resumen de Cumplimiento

| ID | Criterio de Aceptación | Estado | Observaciones |
|---|---|---|---|
| AC-01 | Arquitectura Observer: `UniversityEventSubject` implementa `ISubject`, `emit()` incluye `category` en payload | ✅ **CUMPLIDO** | El método se llama `emit()` (no `notify()`), pero cumple la misma función. La categoría viaja tanto en el campo raíz como dentro de `payload`. |
| AC-02 | Endpoints `POST /eventos/suscribir` y `DELETE /eventos/suscribir` con persistencia y manejo de errores | ⚠️ **PARCIAL** | El código del microservicio es correcto, pero **el Gateway no ruteaba estas rutas** al events service (BUG CRÍTICO corregido). |
| AC-03 | Filtrado por categoría: evento 'Académico' no notifica a suscritos 'Deportivo' | ✅ **CUMPLIDO** | El filtro ocurre en `UniversityEventObserver.handle()` línea 20-21, consultando `getSubscribersByCategory(category)`. |
| AC-04 | Observer conectado a WebSocket Gateway con filtro de categoría antes de emitir | ✅ **CUMPLIDO** | La emisión ocurre solo a usuarios retornados por `getSubscribersByCategory()`. El `socketGateway` está inyectado vía constructor. |

---

## Hallazgos y Bugs Corregidos

### Bug #1 (CRÍTICO) — Gateway no rutea `/api/v1/eventos/suscribir`

**Archivo:** `backend/gateway/src/app/createGatewayServer.ts:49-51`

**Problema:** La función `isEventsRoute()` solo matcheaba `/api/v1/events` y `/api/v1/events/*`, pero los endpoints de suscripción están en `/api/v1/eventos/suscribir`. Cualquier `POST /api/v1/eventos/suscribir` desde el frontend recibía `404 Route not found` del Gateway y jamás llegaba al microservicio de eventos.

**Solución:** Se agregaron las rutas de suscripción al matcher:

```typescript
function isEventsRoute(pathname: string): boolean {
  return (
    pathname === "/api/v1/events" ||
    pathname.startsWith("/api/v1/events/") ||
    pathname === "/api/v1/eventos/suscribir" ||
    pathname === "/api/v1/eventos/suscribir/"
  );
}
```

### Bug #2 (CRÍTICO) — CreateEvent controller no envía `category` al use case

**Archivo:** `backend/services/events/src/interfaces/http/controllers/EventsController.ts`

**Problema:** El controlador extraía del body `title`, `description`, `location`, `startAt`, `endAt` y `maxCapacity`, pero **omitía `category`**. Como `CreateEvent.execute()` solo emite `NUEVO_EVENTO` si `input.category` es truthy, todos los eventos creados vía API nunca disparaban notificaciones.

```typescript
// ANTES (roto): category nunca llegaba
const result = await this.createEvent.execute({
  actorUserId,
  title: body.title ?? "",
  description: body.description ?? "",
  location: body.location ?? "",
  startAt: body.startAt ?? "",
  endAt: body.endAt ?? "",
  maxCapacity: body.maxCapacity,
  // category: body.category  ← FALTABA
});
```

**Solución:** Se agregaron `category` e `imageUrl` al payload:

```typescript
const result = await this.createEvent.execute({
  actorUserId,
  title: body.title ?? "",
  description: body.description ?? "",
  location: body.location ?? "",
  startAt: body.startAt ?? "",
  endAt: body.endAt ?? "",
  category: body.category,      // ✅ added
  imageUrl: body.imageUrl,      // ✅ added
  maxCapacity: body.maxCapacity,
});
```

---

## Evidencia de Código

### 1. Interfaz `ISubject`

**Archivo:** `backend/services/events/src/domain/events/ISubject.ts`

```typescript
export interface ISubject {
  subscribe(observer: IObserver): void;
  unsubscribe(observer: IObserver): void;
  emit(event: UniversityEvent): Promise<void>;
}
```

### 2. `UniversityEventSubject` (implementación concreta)

**Archivo:** `backend/services/events/src/domain/events/UniversityEventSubject.ts`

```typescript
export class UniversityEventSubject implements ISubject {
  private readonly observers: Set<IObserver> = new Set();

  subscribe(observer: IObserver): void { /* ... */ }
  unsubscribe(observer: IObserver): void { /* ... */ }

  async emit(event: UniversityEvent): Promise<void> {
    const promises = [...this.observers].map(o =>
      o.handle(event).catch(err => {
        console.error(`[${this.name}] Observer "${o.name}" failed:`, err);
      }),
    );
    await Promise.all(promises);
  }
}
```

### 3. Evento `NUEVO_EVENTO` con categoría en el payload

**Archivo:** `backend/services/events/src/domain/events/UniversityEvents.ts`

```typescript
export interface NuevoEventoUniversidadEvent {
  readonly type: "NUEVO_EVENTO";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly eventId: string;
  readonly title: string;
  readonly category: EventCategory;          // ✅ categoría en raíz
  readonly message: string;
  readonly payload: {
    eventId: string;
    title: string;
    description: string;
    category: EventCategory;                 // ✅ categoría en payload anidado
    location: string;
    startAt: string;
    organizerId: string;
    organizerName?: string;
    imageUrl?: string;
  };
}
```

### 4. FILTRO POR CATEGORÍA — El corazón del AC-03

**Archivo:** `backend/services/events/src/domain/events/UniversityEventObserver.ts`

```typescript
async handle(event: UniversityEvent): Promise<void> {
    if (event.type !== "NUEVO_EVENTO") return;          ← Filtro por tipo

    const category = event.category;                     ← Extrae categoría del evento
    const subscribers = await this.subscriptionRepository
      .getSubscribersByCategory(category);               ← SOLO usuarios de ESA categoría

    const promises = subscribers.map(userId =>
      this.socketGateway.emitToUser(
        userId, "NUEVO_EVENTO",
        event.payload as unknown as Record<string, unknown>
      )                                                  ← Solo emite a los filtrados
    );
    await Promise.all(promises);
}
```

**Respuesta a la pregunta crítica:**  
> ¿Cómo garantiza el sistema que si se crea un evento 'Académico', un estudiante suscrito solo a 'Deportivo' NO reciba la notificación?

El filtro ocurre en `UniversityEventObserver.handle()` línea 20-21. El método:
1. Extrae `event.category` del evento emitido
2. Consulta `subscriptionRepository.getSubscribersByCategory(category)` que ejecuta `SELECT user_id FROM event_subscriptions WHERE category = $1`
3. **Solo itera sobre los user_ids retornados** por esa consulta SQL
4. Llama a `socketGateway.emitToUser()` exclusivamente para esos usuarios

Un estudiante suscrito a 'Deportivo' **nunca aparece en el resultado** de `getSubscribersByCategory('academico')`, por lo tanto **nunca recibe el mensaje WebSocket**.

### 5. Repositorio de suscripciones (Postgres)

**Archivo:** `backend/services/events/src/infrastructure/database/PostgresSubscriptionRepository.ts`

```typescript
async subscribe(userId: string, category: EventCategory): Promise<void> {
  await this.pool.query(
    `INSERT INTO event_subscriptions (user_id, category)
     VALUES ($1, $2)
     ON CONFLICT (user_id, category) DO NOTHING`,  ← idempotente
    [userId, category],
  );
}

async getSubscribersByCategory(category: EventCategory): Promise<string[]> {
  const result = await this.pool.query(
    `SELECT user_id FROM event_subscriptions WHERE category = $1`,  ← filtro SQL
    [category],
  );
  return result.rows.map(r => r.user_id as string);
}
```

---

## Test de Verificación

**Archivo:** `backend/services/events/src/domain/events/observer.test.ts`

```typescript
describe("US-O03 - Escenario crítico: filtro por categoría impide fuga de notificaciones", () => {
  it("Usuario A suscrito a Sistemas, B a Artes, evento en Sistemas -> B NO debe recibir notificación", async () => {
    const repo = new InMemorySubscriptionRepository();
    const emitted: Array<{ userId: string; event: string }> = [];

    const gateway: IEventSocketGateway = {
      emitToUser: async (userId, event, _payload) => { emitted.push({ userId, event }); },
    };

    // Usuario A suscrito a "academico" (simula "Sistemas")
    await repo.subscribe("user_A", "academico");
    // Usuario B suscrito a "deportivo" (simula "Artes")
    await repo.subscribe("user_B", "deportivo");

    const observer = new UniversityEventObserver(repo, gateway);
    const eventoSistemas: UniversityEvent = {
      ...baseEvent,
      category: "academico",
      payload: { ...baseEvent.payload, category: "academico" },
    };

    await observer.handle(eventoSistemas);

    const notifiedUserIds = emitted.map(e => e.userId);
    // User_A debe recibir
    assert.ok(notifiedUserIds.includes("user_A"),
      "User A (Sistemas) debería recibir la notificación");
    // User_B NO debe recibir — si está en la lista, el test FALLA
    assert.equal(notifiedUserIds.includes("user_B"), false,
      "User B (Artes) NO debería recibir la notificación");
    // Solo user_A debe estar en la lista
    assert.equal(emitted.length, 1,
      "Solo un usuario debería ser notificado");
  });
});
```

**Comportamiento esperado del test:**
- `user_A` (Sistemas/academico) → `assert.ok` pasa → recibe notificación
- `user_B` (Artes/deportivo) → `assert.equal(false)` pasa → **NO recibe**
- Si `user_B` apareciera en `emitted`, el test **FALLA** con "User B (Artes) NO debería recibir la notificación"

---

## Endpoints y Contratos (Post-fixes)

| Método | Ruta | Body | Respuesta | Errores |
|---|---|---|---|---|
| `POST` | `/api/v1/eventos/suscribir` | `{ "categoria": "academico" \| "cultural" \| "deportivo" \| "otro" }` | `200` `{ success, message }` | `400` categoría inválida, `401` no auth |
| `DELETE` | `/api/v1/eventos/suscribir` | `{ "categoria": "academico" \| "cultural" \| "deportivo" \| "otro" }` | `200` `{ success, message }` | `400` categoría inválida, `401` no auth |
| `POST` | `/api/v1/events` | `{ title, description, location, startAt, category, imageUrl?, endAt?, maxCapacity? }` | `201` `Event` | `401`, `422` |

Las rutas de suscripción viajan por el Gateway bajo `/api/v1/eventos/suscribir`, que ahora está correctamente ruteado al servicio de eventos.

---

## Recomendaciones Post-Auditoría

1. **Agregar `GET /api/v1/eventos/suscripciones`** para que el frontend pueda consultar a qué categorías está suscrito el usuario actual.
2. **Migrar `isAdminUser`** de stub (siempre `true`) a validación real con JWT claims cuando el módulo de auth esté completo.
3. **Inicializar tabla `event_subscriptions`** automáticamente en el bootstrap del servicio o vía migración.
4. **Conectar WebSocket real** (Supabase Realtime) en lugar del stub `console.log` actual.
5. **Considerar evento `EVENTO_ELIMINADO`** para notificar a suscriptores cuando se cancela un evento.
