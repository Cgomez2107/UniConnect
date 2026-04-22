# Messaging Service

Microservicio del dominio de mensajeria privada 1:1 de UniConnect.

## Alcance

Este servicio cubre:

- Conversaciones privadas entre dos usuarios.
- Envio y lectura de mensajes.
- Mensajes de texto y multimedia (imagen/audio).
- Respuesta a mensajes (reply).
- Compatibilidad con esquema nuevo y esquema legado.

## Integracion End-to-End

Flujo completo en produccion/local:

1. Frontend sube archivo a Supabase Storage.
2. Frontend envia metadatos al gateway (`/api/v1/messages`).
3. Gateway reenvia a `@uniconnect/messaging`.
4. Messaging valida permisos/entrada y persiste en Postgres.
5. Frontend consulta conversaciones/mensajes desde gateway.

### Piezas involucradas

- Frontend:
	- `frontend/app/chat/[conversationId].tsx`
	- `frontend/components/chat/ChatInput.tsx`
	- `frontend/components/chat/MessageBubble.tsx`
	- `frontend/lib/services/infrastructure/chatMediaUpload.ts`
- Gateway:
	- proxy de `/api/v1/conversations*` y `/api/v1/messages*`
- Messaging:
	- `backend/services/messaging/src/**`
- Storage y migraciones:
	- `backend/supabase/migrations/20260319_messaging_media.sql`
	- `backend/supabase/migrations/20260319_chat_audio_bucket.sql`

## Arquitectura

Clean Architecture por capas:

- `src/domain`: entidades y contratos.
- `src/application`: casos de uso.
- `src/infrastructure`: repositorios (`Postgres` + `InMemory`).
- `src/interfaces`: controlador HTTP, DTOs, rutas y autenticacion.

Entry point:

- `src/main.ts`: carga configuracion, arma dependencias y levanta servidor.

## Persistencia y compatibilidad

El servicio selecciona repositorio en runtime:

- `PostgresMessagingRepository` cuando la configuracion de DB es valida.
- `InMemoryMessagingRepository` como fallback en entornos sin DB.

Ademas, el repositorio Postgres contempla dos escenarios:

- Esquema nuevo: columnas `media_url`, `media_type`, `media_filename`, `reply_*`.
- Esquema legado: fallback de insercion/lectura cuando esas columnas aun no existen.

Esto evita caidas si la migracion de multimedia no se ha ejecutado en todos los entornos.

## Autenticacion y autorizacion

Identidad del actor:

- Header `x-user-id`, o
- `sub` del JWT en `Authorization: Bearer <token>`.

Reglas de acceso:

- Solo participantes de una conversacion pueden verla.
- Solo participantes pueden listar/enviar mensajes en esa conversacion.
- Solo participantes pueden marcar mensajes como leidos.

## API HTTP

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
	- body minimo: `{ "conversationId": "<id>", "content": "texto" }`
	- body multimedia:
		- `mediaUrl`
		- `mediaType`
		- `mediaFilename`
		- `replyToMessageId`
		- `replyPreview`
- `PATCH /api/v1/conversations/:id/read` — Marcar todos los mensajes no leidos de una conversacion como leidos (solo emisarios de otros usuarios)
- `PATCH /api/v1/messages/:id/read`

### Health

- `GET /health`

## Migraciones necesarias

Para funcionalidad multimedia completa:

1. Ejecutar `backend/supabase/migrations/20260319_messaging_media.sql`.
2. Ejecutar `backend/supabase/migrations/20260319_chat_audio_bucket.sql`.

La segunda migracion crea el bucket `chat-audio` con MIME permitidos para notas de voz y politicas RLS de `storage.objects`.

## Variables de entorno

Revisar `.env.example` del servicio.

Claves principales:

- `PORT`, `NODE_ENV`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`

En gateway:

- `MESSAGING_BASE_URL=http://localhost:3104`

## Ejecucion local

Desde `backend/`:

1. `pnpm install`
2. `pnpm --filter @uniconnect/messaging dev`

Con gateway:

1. `pnpm --filter @uniconnect/gateway dev`
2. Consumir endpoints via `http://localhost:3000/api/v1/...`

## Verificacion rapida

1. Crear/obtener conversacion.
2. Enviar mensaje de texto.
3. Enviar imagen (con `mediaUrl`).
4. Enviar audio (con `mediaType` de audio).
5. Confirmar lectura y listado de conversaciones.

## Scripts utiles

- `pnpm --filter @uniconnect/messaging dev`
- `pnpm --filter @uniconnect/messaging build`
- `pnpm --filter @uniconnect/messaging start`
- `pnpm --filter @uniconnect/messaging typecheck`
