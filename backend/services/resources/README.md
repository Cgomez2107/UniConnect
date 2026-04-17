# Resources Service

Microservicio del dominio de recursos academicos. Expone CRUD de recursos de estudio y ejecuta limpieza de archivo en Supabase Storage al eliminar un recurso.

## Objetivo

Centralizar la logica de recursos en un servicio independiente, desacoplando al frontend de consultas directas a Supabase para este dominio.

## Alcance funcional actual

- Listar recursos con filtros por `subjectId`, `userId` y `search`.
- Obtener recurso por ID.
- Crear recurso.
- Actualizar `title` y/o `description`.
- Eliminar recurso.
- Limpieza best-effort en Storage al borrar (si se configuran variables de Supabase).

## Arquitectura aplicada

Se implementa Clean Architecture por capas:

- `src/domain`: entidades y contratos de repositorio.
- `src/application`: casos de uso (`Create`, `List`, `GetById`, `Update`, `Delete`).
- `src/infrastructure`: adaptadores de persistencia y storage.
- `src/interfaces`: HTTP (controladores, rutas, DTOs y middlewares).

Punto de entrada:

- `src/main.ts`: carga de entorno, seleccion de repositorio, wiring de casos de uso y arranque HTTP.

## Persistencia: Postgres con fallback

La seleccion del repositorio se hace en runtime:

- Si existen `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` validas, usa `PostgresStudyResourceRepository`.
- Si falta configuracion o hay placeholder, usa `InMemoryStudyResourceRepository` y registra warning.

Esto permite desarrollo local aun sin DB, pero en ambientes reales debe usarse Postgres.

## Integracion con gateway

El gateway enruta `\api\v1\resources` y `\api\v1\resources\:id` hacia este servicio.

Dependencias de gateway:

- `RESOURCES_BASE_URL` apuntando al servicio, por ejemplo: `http://localhost:3103`.

## Integracion con frontend

El frontend consume `\resources` via API HTTP (no Supabase directo para este dominio) a traves de:

- `frontend/lib/services/infrastructure/repositories/ApiStudyResourceRepository.ts`
- DI en `frontend/lib/services/di/container.ts`

Variable requerida en frontend:

- `EXPO_PUBLIC_API_BASE_URL=http://<host>:3000/api/v1`

## Contrato HTTP

Base path: `\api\v1\resources`

- `GET /api/v1/resources?subjectId=&userId=&search=&page=&limit=`
- `GET /api/v1/resources/:id`
- `POST /api/v1/resources`
- `PUT /api/v1/resources/:id`
- `DELETE /api/v1/resources/:id`

Health del servicio:

- `GET /health`

### Autenticacion

Se requiere `Authorization: Bearer <jwt>` para crear, actualizar y eliminar.

El servicio extrae `sub` del JWT para identificar al actor.

### Reglas de autorizacion

- Solo el autor del recurso puede editarlo.
- Solo el autor del recurso puede eliminarlo.

## Variables de entorno

Ver archivo `.env.example`.

Variables clave:

- Servicio: `PORT`, `NODE_ENV`.
- DB: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`.
- Storage cleanup (opcional): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Ejecucion local

Desde la raiz de backend:

1. `pnpm install`
2. `pnpm --filter @uniconnect/resources dev`

En paralelo, para exponer por gateway:

1. `pnpm --filter @uniconnect/gateway dev`

## Validacion rapida

1. Health del servicio: `http://localhost:3103/health`
2. Health del gateway: `http://localhost:3000/health`
3. Listado por gateway: `http://localhost:3000/api/v1/resources`

## Flujo de eliminacion

Al eliminar un recurso:

1. Se valida autoria.
2. Se elimina registro en `study_resources`.
3. Se intenta eliminar archivo en Supabase Storage (best-effort).
4. Si falla storage cleanup, la eliminacion en DB no se revierte y se registra warning.

## Scripts

- `pnpm --filter @uniconnect/resources dev`
- `pnpm --filter @uniconnect/resources build`
- `pnpm --filter @uniconnect/resources start`
- `pnpm --filter @uniconnect/resources typecheck`

## Estado de implementacion

Servicio funcional para CRUD de recursos, integrado con gateway y frontend para el dominio de recursos.
