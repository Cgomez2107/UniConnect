# Auditoría US-D03: Patrón Decorator — Notificaciones

> **Auditor:** Arquitecto de Software Senior  
> **Servicio:** `backend/services/messaging/src/domain/notifications/decorators/`  
> **Patrón:** Decorator (GoF)  
> **Fecha:** 2026-05-12  

---

## 1. Reporte de Cumplimiento

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| **AC-01** | Interfaz única `INotification` compartida por base y decoradores | ✅ **CUMPLIDO** | `INotification.ts` — 6 métodos: `getMensaje()`, `getDestinatario()`, `getTimestamp()`, `getMetadata()`, `render()`, `toJSON()` |
| **AC-02** | `PriorityDecorator` añade nivel `normal`/`urgente`/`critica` via composición | ✅ **CUMPLIDO** | `PriorityDecorator.ts:21-23` — `getMetadata()` hace spread + `nivel` |
| **AC-03** | `ActionDecorator` añade `{ label, endpoint }` via composición | ✅ **CUMPLIDO** | `ActionDecorator.ts:24-26` — `getMetadata()` hace spread + `accion` |
| **AC-04** | Composición en cadena: `Action(Priority(Base))` produce JSON completo | ✅ **CUMPLIDO** | `notification.test.ts:115-148` — test + `toJSON` demuestra fusión |
| **AC-05** | Transparencia: `getMensaje()` original intacto tras N decoradores | ✅ **CUMPLIDO** | `notification.test.ts:151-178` — getters delegados preservan valor |
| **SRP** | Decoradores solo gestionan estructura — sin lógica de envío acoplada | ✅ **CUMPLIDO** | Ningún decorador importa WebSocket, Email, ni `NotificationService` |
| **Integración** | Decoradores conectados al pipeline de notificaciones | ❌ **NO CUMPLIDO** | Los decoradores son standalone; no se instancian en ningún controller/use case |

---

## 2. Interfaz Única (AC-01)

Todas las clases comparten `INotification`:

```typescript
// INotification.ts
export interface INotification {
  readonly mensaje: string;
  readonly destinatario: string;
  readonly timestamp: string;

  getMensaje(): string;
  getDestinatario(): string;
  getTimestamp(): string;
  getMetadata(): Record<string, unknown>;
  render(): string;
  toJSON(): Record<string, unknown>;
}
```

| Clase | Implementa | Rol |
|---|---|---|
| `BaseNotification` | `INotification` directamente | Componente concreto |
| `NotificationDecorator` | `INotification` (abstracta) | Decorador base — compone `INotification` |
| `PriorityDecorator` | `extends NotificationDecorator` | Decorador concreto: añade `nivel` |
| `ActionDecorator` | `extends NotificationDecorator` | Decorador concreto: añade `accion` |

---

## 3. Decorador de Prioridad (AC-02)

```typescript
// PriorityDecorator.ts
export type NivelPrioridad = "normal" | "urgente" | "critica";

export class PriorityDecorator extends NotificationDecorator {
  private readonly nivel: NivelPrioridad;

  constructor(notification: INotification, nivel: NivelPrioridad) {
    super(notification);
    if (!["normal", "urgente", "critica"].includes(nivel)) {
      throw new Error(`Nivel inválido: "${nivel}". Debe ser "normal", "urgente" o "critica".`);
    }
    this.nivel = nivel;
  }

  override getMetadata(): Record<string, unknown> {
    return { ...this.notification.getMetadata(), nivel: this.nivel };
  }

  override render(): string {
    const etiqueta = this.nivel === "critica" ? "🔴 CRÍTICA"
      : this.nivel === "urgente" ? "🟠 URGENTE"
      : "🔵 NORMAL";
    return `[${etiqueta}] ${this.notification.render()}`;
  }
}
```

**Validación incluida:** solo acepta `"normal"`, `"urgente"`, `"critica"`. Cualquier otro valor lanza `Error`.

---

## 4. Decorador de Acción (AC-03)

```typescript
// ActionDecorator.ts
export interface Accion {
  label: string;
  endpoint: string;
}

export class ActionDecorator extends NotificationDecorator {
  private readonly accion: Accion;

  constructor(notification: INotification, accion: Accion) {
    super(notification);
    if (!accion.label || !accion.endpoint) {
      throw new Error("La acción debe tener un label y un endpoint no vacíos.");
    }
    this.accion = accion;
  }

  override getMetadata(): Record<string, unknown> {
    return { ...this.notification.getMetadata(), accion: { ...this.accion } };
  }

  override render(): string {
    return `${this.notification.render()}\n[Acción: ${this.accion.label} → ${this.accion.endpoint}]`;
  }
}
```

**Validación incluida:** `label` y `endpoint` no pueden ser cadenas vacías.

---

## 5. Prueba de Composición — Script de Consola

**Archivo:** `backend/services/messaging/src/domain/notifications/decorators/composition-test.ts`

```typescript
import { BaseNotification } from "./BaseNotification.js";
import { PriorityDecorator } from "./PriorityDecorator.js";
import { ActionDecorator } from "./ActionDecorator.js";

// 1. Crear notificación base
const base = new BaseNotification({
  mensaje: "Tienes una nueva solicitud de transferencia de administrador",
  destinatario: "user_abc123",
  timestamp: "2026-05-10T14:30:00.000Z",
});

console.log("--- 1. BaseNotification (solo) ---");
console.log(JSON.stringify(base.toJSON(), null, 2));

// 2. Envolver con prioridad URGENTE
const urgente = new PriorityDecorator(base, "urgente");

console.log("\n--- 2. PriorityDecorator (urgente) sobre Base ---");
console.log(JSON.stringify(urgente.toJSON(), null, 2));

// 3. Envolver con acción sobre el resultado anterior
const completo = new ActionDecorator(urgente, {
  label: "Revisar solicitud",
  endpoint: "/api/v1/admin-transfers/pending",
});

console.log("\n--- 3. ActionDecorator sobre PriorityDecorator(Base) ---");
console.log(JSON.stringify(completo.toJSON(), null, 2));
```

### Salida JSON del script

```json
--- 1. BaseNotification (solo) ---
{
  "mensaje": "Tienes una nueva solicitud de transferencia de administrador",
  "destinatario": "user_abc123",
  "timestamp": "2026-05-10T14:30:00.000Z"
}

--- 2. PriorityDecorator (urgente) sobre Base ---
{
  "mensaje": "Tienes una nueva solicitud de transferencia de administrador",
  "destinatario": "user_abc123",
  "timestamp": "2026-05-10T14:30:00.000Z",
  "nivel": "urgente"
}

--- 3. ActionDecorator sobre PriorityDecorator(Base) ---
{
  "mensaje": "Tienes una nueva solicitud de transferencia de administrador",
  "destinatario": "user_abc123",
  "timestamp": "2026-05-10T14:30:00.000Z",
  "nivel": "urgente",
  "accion": {
    "label": "Revisar solicitud",
    "endpoint": "/api/v1/admin-transfers/pending"
  }
}
```

El JSON final es **exactamente lo que el Frontend debe esperar** del endpoint de notificaciones cuando se usa la composición completa: los 3 campos base + `nivel` + `accion`.

---

## 6. Principio de Responsabilidad Única (SRP)

Validación de que los decoradores NO tienen lógica de envío acoplada:

| Archivo | ¿Importa WebSocket/Email/Strategy? | ¿Contiene lógica de envío? |
|---|---|---|
| `BaseNotification.ts` | ❌ No | ❌ Solo estructura |
| `NotificationDecorator.ts` | ❌ No | ❌ Solo delegación |
| `PriorityDecorator.ts` | ❌ No | ❌ Solo añade `nivel` |
| `ActionDecorator.ts` | ❌ No | ❌ Solo añade `accion` |

**Los decoradores gestionan exclusivamente la estructura del mensaje.** El envío (WebSocket, Email, Push) está en las estrategias (`InAppWebSocketStrategy`, `EmailInstitucionalStrategy`, `PushMovilStrategy`) contenidas en `shared/patterns/strategy/`. Separación de responsabilidades correcta.

---

## 7. Archivos Auditados

| Archivo | Rol | Líneas |
|---|---|---|
| `.../decorators/INotification.ts` | Interfaz común del patrón | 12 |
| `.../decorators/BaseNotification.ts` | Componente concreto | 33 |
| `.../decorators/NotificationDecorator.ts` | Decorador abstracto (composición) | 25 |
| `.../decorators/PriorityDecorator.ts` | Decorador concreto: prioridad | 33 |
| `.../decorators/ActionDecorator.ts` | Decorador concreto: acción | 35 |
| `.../decorators/notification.test.ts` | Tests unitarios AC-01 a AC-05 | 179 |
| `.../tests/feat/us-d03-notification-decorators.spec.ts` | Tests de feature (apilamiento, colisión) | 160 |

---

## 8. Hallazgo Principal: Falta de Integración

**Los decoradores están completos y probados, pero NO están conectados al pipeline de producción.**

El flujo actual del `NotificationMapper.ts` no usa los decoradores:

```typescript
// NotificationMapper.ts (state actual — NO usa decoradores)
case "TRANSFERENCIA_ADMIN_SOLICITADA":
  return {
    dto: {
      userId: event.newAdminId,
      type: "transferencia_admin_solicitada",
      title: event.groupName,
      body: "Tienes una solicitud para transferir la administracion del grupo.",
      payload: { transferId, groupId, oldAdminId },
      priority: "urgente",   // ← hardcodeado, no viene de un decorador
    },
  };
```

El flujo deseado sería:
```
BaseNotification(mensaje, destinatario, timestamp)
  → PriorityDecorator(..., "urgente")     // construye nivel dinámicamente
  → ActionDecorator(..., { label, endpoint }) // construye acción
  → .toJSON() → mapea a NotificacionDTO
  → NotificationService.notificar(dto)
```

---

## 9. Sugerencias de Mejora

| # | Sugerencia | Prioridad |
|---|---|---|
| 1 | **Integrar decoradores en `NotificationMapper`** — Reemplazar los `priority` hardcodeados por `new PriorityDecorator(baseNotif, "urgente").toJSON()` | Alta |
| 2 | **Crear un `NotificationBuilder`** — Clase fluent que encadene decoradores: `new NotificationBuilder(mensaje, user).urgente().conAccion(btn).build()` | Media |
| 3 | **Agregar `GET /notifications/:id` endpoint** — Que devuelva una notificación individual serializada con decoradores para que el frontend vea `nivel` y `accion` | Media |
| 4 | **Cachear render()** — Si `render()` se llama múltiples veces, cada decorador reconstruye la cadena. Podría usarse memoización simple. | Baja |
