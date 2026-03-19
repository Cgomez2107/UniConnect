# Messaging Service

Microservicio del dominio de mensajeria (US-011, US-015, US-016).

## Objetivo

Exponer una API para conversaciones 1:1 y mensajes, desacoplando este dominio del acceso directo desde frontend a Supabase.

## Estado actual

- Conversaciones:
	- listar conversaciones del usuario autenticado.
	- obtener conversacion por id.
	- crear u obtener conversacion existente entre dos participantes.
	- actualizar actividad de la conversacion (`touch`).
- Mensajes:
	- listar mensajes por conversacion.
	- obtener mensaje por id.
	- enviar mensaje.
	- marcar mensaje como leido.

## Arquitectura

Clean Architecture por capas:

- `src/domain`: entidades y contratos.
- `src/application`: casos de uso.
- `src/infrastructure`: repositorios Postgres y fallback in-memory.
- `src/interfaces`: HTTP (controlador, rutas, DTOs, middlewares).

Punto de entrada:

- `src/main.ts`: carga env, selecciona repositorio, hace wiring y arranca servidor.

## Persistencia

Seleccion de repositorio en runtime:

- Usa `PostgresMessagingRepository` cuando existe configuracion DB valida.
- Hace fallback a `InMemoryMessagingRepository` cuando falta configuracion.

## Autenticacion y permisos

- El actor se extrae de `x-user-id` o del `sub` en `Authorization: Bearer <jwt>`.
- Solo participantes de una conversacion pueden:
	- verla,
	- listar sus mensajes,
	- enviar mensajes,
	- marcar mensajes como leidos,
	- tocar actividad.

## Contrato HTTP

Base path: `/api/v1`

### Conversaciones

- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id`
- `POST /api/v1/conversations`
	- body: `{ "participantB": "<userId>" }`
- `PATCH /api/v1/conversations/:id/touch`

### Mensajes

- `GET /api/v1/messages?conversationId=<id>&limit=50&offset=0`
- `GET /api/v1/messages/:id`
- `POST /api/v1/messages`
	- body: `{ "conversationId": "<id>", "content": "texto" }`
- `PATCH /api/v1/messages/:id/read`

### Health

- `GET /health`

## Variables de entorno

Ver `.env.example`.

Claves:

- `PORT`, `NODE_ENV`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`

## Ejecucion local

Desde `backend/`:

1. `pnpm install`
2. `pnpm --filter @uniconnect/messaging dev`

## Integracion con gateway

El gateway debe enrutar:

- `/api/v1/conversations`
- `/api/v1/messages`

con `MESSAGING_BASE_URL=http://localhost:3104`.

## Scripts

- `pnpm --filter @uniconnect/messaging dev`
- `pnpm --filter @uniconnect/messaging build`
- `pnpm --filter @uniconnect/messaging start`
- `pnpm --filter @uniconnect/messaging typecheck`
