# Guía de Contratos API — Frontend

> **Versión:** 1.0 — Integración final de Decorators (Perfil + Notificaciones)  
> **Propósito:** Contrato oficial entre Backend y Frontend para los endpoints decorados.

---

## 1. Perfil de Estudiante (D02)

### Endpoint

```
GET /api/v1/students/:id
GET /api/v1/students/:id?vista=completa
GET /perfil/:id
GET /perfil/:id?vista=completa
```

### JSON Simple (sin `?vista=completa`)

Se devuelve la información base del estudiante — **sin consultas pesadas**.

```json
{
  "id": "user-123",
  "fullName": "Carlos Pérez",
  "avatarUrl": null,
  "programName": "Ingeniería de Sistemas",
  "semester": 6,
  "sharedSubjects": [
    { "id": "mat-1", "name": "Cálculo III" },
    { "id": "mat-2", "name": "Estructuras de Datos" }
  ]
}
```

### JSON Decorado (con `?vista=completa`)

Se construye `BaseProfile → StatisticsDecorator → BadgesDecorator` y se devuelve la metadata completa.

```json
{
  "id": "user-123",
  "fullName": "Carlos Pérez",
  "avatarUrl": null,
  "carrera": "Ingeniería de Sistemas",
  "semestre": 6,
  "asignaturasActivas": [
    { "id": "mat-1", "name": "Cálculo III" },
    { "id": "mat-2", "name": "Estructuras de Datos" }
  ],
  "indicadores": {
    "gruposCreados": 3,
    "gruposParticipa": 5,
    "mensajesEnviados": 42
  },
  "insignias": [
    {
      "id": "primer-mensaje",
      "nombre": "Primer Mensaje",
      "descripcion": "Has enviado tu primer mensaje",
      "iconoUrl": "/insignias/primer-mensaje.svg",
      "fechaObtenida": "2026-05-01"
    },
    {
      "id": "colaborador",
      "nombre": "Colaborador",
      "descripcion": "Participas en grupos de estudio",
      "iconoUrl": "/insignias/colaborador.svg",
      "fechaObtenida": "2026-05-08"
    }
  ]
}
```

### Mapa de campos

| Capa | Campo | Tipo | Origen |
|---|---|---|---|
| **BaseProfile** | `id` | `string` | Student entity |
| | `fullName` | `string` | Student entity |
| | `avatarUrl` | `string \| null` | Student entity |
| | `carrera` | `string` | Student.programName |
| | `semestre` | `number \| null` | Student.semester |
| | `asignaturasActivas` | `Array<{id, name}>` | Student.sharedSubjects |
| **StatisticsDecorator** | `indicadores.gruposCreados` | `number` | DB query (messages, groups) |
| | `indicadores.gruposParticipa` | `number` | DB query |
| | `indicadores.mensajesEnviados` | `number` | DB query |
| **BadgesDecorator** | `insignias[].id` | `string` | DB query |
| | `insignias[].nombre` | `string` | DB query |
| | `insignias[].descripcion` | `string` | DB query |
| | `insignias[].iconoUrl` | `string` | DB query |
| | `insignias[].fechaObtenida` | `string` (ISO) | DB query |

---

## 2. Notificaciones (D03)

### Endpoint

```
GET /api/v1/notifications?page=1&limit=20
```

### JSON Simple (sin decoradores — notificación persistida)

El `GET /notifications` devuelve lo que se persiste en BD. El campo `payload` contiene datos crudos del evento.

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "user-new-admin",
      "type": "transferencia_admin_solicitada",
      "title": "Grupo de Química",
      "body": "Tienes una solicitud para transferir la administracion del grupo.",
      "payload": {
        "transferId": "trf-001",
        "groupId": "grp-001",
        "oldAdminId": "user-old-admin"
      },
      "createdAt": "2026-05-12T10:30:00.000Z",
      "readAt": null
    }
  ]
}
```

### JSON Decorado (lo que viaja en el DTO al `NotificationService`)

Cuando el `NotificationMapper` construye el DTO, usa la cadena de decoradores. El `NotificacionDTO` resultante lleva `priority` y opcionalmente `action`:

```json
{
  "userId": "user-new-admin",
  "type": "transferencia_admin_solicitada",
  "title": "Grupo de Química",
  "body": "Tienes una solicitud para transferir la administracion del grupo.",
  "payload": {
    "transferId": "trf-001",
    "groupId": "grp-001",
    "oldAdminId": "user-old-admin"
  },
  "priority": "urgente",
  "action": {
    "label": "Revisar solicitud",
    "endpoint": "/api/v1/study-groups/transfers/trf-001/accept"
  }
}
```

### Valores de `priority` por tipo de evento

| `type` | `priority` | `action` | ¿Cuándo? |
|---|---|---|---|
| `solicitud_ingreso` | `"normal"` | — | Alguien se postula al grupo |
| `miembro_aceptado` | `"normal"` | `{ label: "Ver grupo", endpoint: "/api/v1/study-groups/{id}" }` | Admin acepta postulación |
| `miembro_rechazado` | `"normal"` | — | Admin rechaza postulación |
| `transferencia_admin_solicitada` | `"urgente"` | `{ label: "Revisar solicitud", endpoint: "/api/v1/study-groups/transfers/{id}/accept" }` | Admin solicita transferencia |
| `transferencia_admin_aceptada` | `"normal"` | `{ label: "Ver grupo", endpoint: "/api/v1/study-groups/{id}" }` | Nuevo admin acepta transferencia |

### Mapa de campos `NotificacionDTO`

| Campo | Tipo | Origen | Obligatorio |
|---|---|---|---|
| `userId` | `string` | Destinatario del evento | ✅ Siempre |
| `type` | `string` | Tipo de evento (ver tabla) | ✅ Siempre |
| `title` | `string` | Nombre del grupo o título fijo | ✅ Siempre |
| `body` | `string` | Mensaje (`BaseNotification.getMensaje()`) | ✅ Siempre |
| `payload` | `object \| null` | Metadatos del evento | ✅ Siempre |
| `priority` | `"normal" \| "urgente" \| "critica"` | `PriorityDecorator` | ✅ Siempre |
| `action` | `{ label, endpoint } \| undefined` | `ActionDecorator` | ❌ Solo eventos con acción |

### Estados del decorador `priority`

| Nivel | Prioridad | Display sugerido |
|---|---|---|
| `"normal"` | Baja | Sin énfasis visual |
| `"urgente"` | Media | Badge naranja 🟠 |
| `"critica"` | Alta | Badge rojo 🔴 (reservado para futuro) |

---

## 3. Resumen de Endpoints Decorados

| Recurso | Endpoint | Parámetro | JSON resultante |
|---|---|---|---|
| Perfil base | `GET /api/v1/students/:id` | — | Campos planos del estudiante |
| Perfil completo | `GET /api/v1/students/:id?vista=completa` | `vista=completa` | Base + `indicadores` + `insignias` |
| Perfil base (alias) | `GET /perfil/:id` | — | Campos planos del estudiante |
| Perfil completo (alias) | `GET /perfil/:id?vista=completa` | `vista=completa` | Base + `indicadores` + `insignias` |
| Notificaciones | `GET /api/v1/notifications` | `?page=1&limit=20` | Lista paginada con `priority` en cada item |

---

## 4. Reglas de Negocio para el Frontend

### Perfil
- **No cachear** `?vista=completa` agresivamente: los `indicadores` cambian en cada interacción del usuario.
- Si el backend falla al obtener indicadores/insignias, retorna graceful degradation (solo BaseProfile) con status `200`.
- Los campos `indicadores` e `insignias` aparecen **solo** cuando se usa `?vista=completa`.

### Notificaciones
- `priority: "urgente"` solo se asigna a `transferencia_admin_solicitada`. El frontend debe priorizar visualmente estas notificaciones.
- `action.endpoint` es una ruta relativa a la API. El frontend puede navegar a esa ruta al hacer clic en la notificación (deep link).
- El campo `action` es opcional. El frontend no debe asumir que siempre existe.
