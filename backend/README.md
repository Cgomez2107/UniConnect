# Backend - UniConnect

Backend de UniConnect en monorepo Node.js con enfoque de arquitectura limpia por dominio.

## Objetivo

Este backend esta preparado para migrar la logica que hoy vive en Supabase hacia microservicios Node, manteniendo a Supabase principalmente como base de datos Postgres (y auth en transicion).

## Microservicios activos

- gateway (BFF de entrada)
- study-groups
- resources (scaffold)
- messaging (scaffold)
- profiles-catalog (scaffold)
- events (scaffold)

## Estructura del backend

- gateway/: entrada HTTP para la app cliente.
- services/: microservicios por dominio.
- shared/: contratos y tipos compartidos.
- docs/: decisiones de arquitectura y migracion.
- infra/: CI, docker y plantillas de despliegue.
- supabase/: migraciones SQL y funciones legacy/stub.

## Estado actual

### gateway

Implementado y ejecutable.

Incluye:
- healthcheck: GET /health
- proxy a study-groups: /api/v1/study-groups*
- manejo basico de errores JSON

### study-groups

Implementado y ejecutable.

Incluye:
- GET /health
- GET /api/v1/study-groups
- GET /api/v1/study-groups/:id
- POST /api/v1/study-groups
- GET /api/v1/study-groups/:id/applications
- POST /api/v1/study-groups/:id/apply
- PUT /api/v1/study-groups/applications/:id/review

Persistencia:
- Usa Postgres real si detecta configuracion DB valida.
- Hace fallback a repositorio in-memory si faltan credenciales o siguen placeholders.

Identidad temporal para escrituras:
- Mientras se integra JWT, los endpoints de escritura usan el header x-user-id.

## Requisitos

- Node.js 20+
- Corepack habilitado
- pnpm 9.x

## Instalacion

Desde la raiz del repo:

```bash
cd backend
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm install
```

## Variables de entorno

Cada servicio tiene su propio .env.example.

Archivos clave:
- backend/gateway/.env.example
- backend/services/study-groups/.env.example


En PowerShell puedes crear tus archivos locales asi:

```powershell
Copy-Item .\gateway\.env.example .\gateway\.env.local
Copy-Item .\services\study-groups\.env.example .\services\study-groups\.env.local
```

Luego reemplaza valores placeholder, especialmente:
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD
- JWT_ISSUER
- JWT_JWKS_URL
- JWT_AUDIENCE

## Como correr en local

Abre dos terminales dentro de backend.

Terminal 1:

```bash
pnpm --filter @uniconnect/study-groups dev
```

Terminal 2:

```bash
pnpm --filter @uniconnect/gateway dev
```

Puertos por defecto:
- gateway: 3000
- study-groups: 3101

## Docker (build + run + health)

Desde la raiz del repo:

```bash
docker build -t uniconnect-backend ./backend
```

Ejecuta el contenedor con variables minimas para levantar el gateway:

O en PowerShell, pasando las variables manualmente:

```powershell
docker run -p 3000:3000 -e PORT=3000 -e NODE_ENV=production -e STUDY_GROUPS_BASE_URL=http://localhost:3001 -e RESOURCES_BASE_URL=http://localhost:3002 -e MESSAGING_BASE_URL=http://localhost:3003 -e PROFILES_CATALOG_BASE_URL=http://localhost:3004 -e EVENTS_BASE_URL=http://localhost:3005 -e AUTH_BASE_URL=http://localhost:3006 -e JWT_ACCESS_SECRET=dev-secret uniconnect-backend
```

Valida el healthcheck:

```powershell
curl.exe http://localhost:3000/health
```

> Respuesta esperada:
>
> ```json
> {"status":"ok","version":"0.1.0"}
> ```
>
> El endpoint `GET /health` ahora devuelve `status` y `version`.

## Fly.io deployment

En la carpeta `backend` hay un archivo `fly.toml` preparado para desplegar el gateway:

- `app = "uniconnect-gateway"`
- `primary_region = "fra"`
- `internal_port = 3000`
- `http_checks.path = "/health"`
- `http_checks.method = "get"`

Las variables sensibles deben configurarse con `fly secrets set` y no deben guardarse en `fly.toml`.

El gateway apunta a otros servicios mediante estas variables:
- `AUTH_BASE_URL`
- `STUDY_GROUPS_BASE_URL`
- `RESOURCES_BASE_URL`
- `MESSAGING_BASE_URL`
- `PROFILES_CATALOG_BASE_URL`
- `EVENTS_BASE_URL`

Ejemplo de despliegue inicial del gateway:

```bash
cd backend
fly deploy --config fly.toml
```

Ejemplo de set de secrets manual para el gateway:

```bash
cd backend
fly secrets set `
  JWT_ISSUER="https://becitrklvpadvjwdbmck.supabase.co/auth/v1" `
  JWT_JWKS_URL="https://becitrklvpadvjwdbmck.supabase.co/auth/v1/.well-known/jwks.json" `
  JWT_AUDIENCE="authenticated" `
  JWT_ACCESS_SECRET="dev_secret_token" `
  SUPABASE_URL="https://becitrklvpadvjwdbmck.supabase.co" `
  SUPABASE_SERVICE_ROLE_KEY="Tu_secreto_de_rol" `
  SUPABASE_JWT_SECRET="Tu_secreto_de_jwt" `
  AUTH_BASE_URL="https://uniconnect-auth.fly.dev" `
  STUDY_GROUPS_BASE_URL="https://uniconnect-study-groups.fly.dev" `
  RESOURCES_BASE_URL="https://uniconnect-resources.fly.dev" `
  MESSAGING_BASE_URL="https://uniconnect-messaging.fly.dev" `
  PROFILES_CATALOG_BASE_URL="https://uniconnect-profiles-catalog.fly.dev" `
  EVENTS_BASE_URL="https://uniconnect-events.fly.dev" `
  GATEWAY_PUBLIC_URL="https://uniconnect-gateway.fly.dev" `
  --app uniconnect-gateway
```

URL pública documentada para el gateway:

- `https://uniconnect-gateway.fly.dev`

### Otros servicios desplegables

Cada microservicio puede desplegarse como una app Fly independiente desde su carpeta:

- `backend/services/auth/fly.toml` → `uniconnect-auth`
- `backend/services/study-groups/fly.toml` → `uniconnect-study-groups`
- `backend/services/resources/fly.toml` → `uniconnect-resources`
- `backend/services/messaging/fly.toml` → `uniconnect-messaging`
- `backend/services/profiles-catalog/fly.toml` → `uniconnect-profiles-catalog`
- `backend/services/events/fly.toml` → `uniconnect-events`

Cada servicio usa un Dockerfile local y escucha en `PORT=3000` dentro del contenedor.

### Ejemplo de deploy para un servicio

```bash
cd backend/services/auth
fly deploy --config fly.toml
```

### Configuración de secrets por servicio

Los servicios que requieren conexión a DB deben recibir sus credenciales con `fly secrets set`.
Por ejemplo, para `auth`:

```bash
cd backend/services/auth
fly secrets set \
  NODE_ENV="production" \
  DB_HOST="<db-host>" \
  DB_PORT="5432" \
  DB_NAME="<db-name>" \
  DB_USER="<db-user>" \
  DB_PASSWORD="<db-password>"
```

Ajusta los valores según las dependencias de cada servicio.

## Pruebas rapidas de endpoints

Health gateway:

```bash
curl http://localhost:3000/health
```

Listar solicitudes (via gateway):

```bash
curl "http://localhost:3000/api/v1/study-groups"
```


## Comandos utiles de desarrollo

Desde backend:

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm lint
```

## Contratos y alineacion frontend

Contrato OpenAPI base:
- shared/contracts/openapi/openapi.v1.yaml

Regla de migracion:
- Cambiar frontend por dominio cuando el endpoint backend este listo.
- Evitar migracion big-bang.

## Documentación interactiva de la API (OpenAPI + Swagger)

El gateway expone documentación interactiva generada automáticamente desde los contratos Zod en `@uniconnect/shared-types`.

| Recurso | URL |
|---|---|
| Swagger UI | `http://localhost:3000/docs` |
| OpenAPI JSON | `http://localhost:3000/openapi.json` |

La generación del archivo `openapi.json` ocurre automáticamente en cada `build` del gateway. También puede ejecutarse manualmente:

```bash
cd backend/gateway
pnpm generate:openapi
```

### Versionado histórico

Cada release respaldado automáticamente genera un snapshot del contrato:

```bash
cd backend/gateway
pnpm archive:openapi
```

Esto crea una copia en `backend/docs/openapi/v{version}.json` que queda trackeada en Git, permitiendo recuperar contratos de versiones anteriores.

---

## Guía para desarrolladores: Agregar un nuevo endpoint

Este flujo garantiza que cada nuevo endpoint quede documentado en Swagger y con tipado estricto en toda la aplicación.

### Paso 1: Definir el esquema Zod (o reutilizar uno existente)

Los esquemas de dominio viven en `packages/shared-types/src/schemas/`:

```ts
// packages/shared-types/src/schemas/study-group.schema.ts
export const StudyGroupSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  // ...
});
```

Si el endpoint necesita un DTO con snake_case para la API, también se define aquí.

### Paso 2: Crear el contrato del endpoint

Cada endpoint se declara como un contrato Zod en `packages/shared-types/src/api/`:

```ts
// packages/shared-types/src/api/study-group.contract.ts
import { z } from "zod";
import type { ApiContract } from "./_base.contract.js";

export const UpdateGroupRequestSchema = z.object({
  params: z.object({ id: UuidSchema }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(1000).optional(),
  }),
});

export const UpdateGroupResponseSchema = z.object({
  group: StudyGroupSchema,
});

export const UpdateGroupContract: ApiContract<
  typeof UpdateGroupRequestSchema,
  typeof UpdateGroupResponseSchema
> = {
  method: "PATCH",
  path: "/api/v1/study-groups/:id",
  request: UpdateGroupRequestSchema,
  response: UpdateGroupResponseSchema,
};
```

**Convenciones del `request`:**
- `body` → schema del cuerpo de la petición (POST, PUT, PATCH)
- `query` → schema de query parameters (GET, DELETE)
- `params` → schema de path parameters (`:id`, `:questionId`, etc.)

### Paso 3: Exportar el contrato desde el barrel

```ts
// packages/shared-types/src/index.ts
export * from "./api/study-group.contract.js";
```

### Paso 4: Regenerar tipos compartidos

```bash
cd packages/shared-types
pnpm build
```

Esto compila los esquemas Zod y genera los tipos inferidos disponibles para frontend y backend.

### Paso 5: Implementar el handler en el microservicio

En el microservicio correspondiente (ej. `backend/services/study-groups/`):

```ts
// routes: agregar match de ruta
if (req.method === "PATCH" && detailMatch) {
  await controller.update(req, res, detailMatch[1]);
  return true;
}
```

La validación ya está disponible vía el middleware en `backend/shared/middleware/validationMiddleware.ts`:

```ts
import { validateBody, validateParams } from "../../shared/middleware/validationMiddleware.js";
import { UpdateGroupRequestSchema } from "@uniconnect/shared-types";

const params = validateParams(UpdateGroupRequestSchema.shape.params, { id }, res);
if (!params) return;
const body = validateBody(UpdateGroupRequestSchema.shape.body, parsedBody, res);
if (!body) return;
```

### Paso 6: Agregar el contrato al generador OpenAPI

En `backend/gateway/scripts/generate-openapi.ts`, importar el nuevo contrato y agregarlo al array:

```ts
import { ..., UpdateGroupContract } from "@uniconnect/shared-types";

const contracts: Contract[] = [
  // ... contratos existentes
  UpdateGroupContract,
];
```

### Paso 7: Regenerar OpenAPI y verificar

```bash
cd backend/gateway
pnpm generate:openapi
# o simplemente:
pnpm build
```

Esto genera `backend/gateway/openapi.json` con el nuevo endpoint documentado automáticamente.

Visitar `http://localhost:3000/docs` para ver el endpoint en Swagger UI.

### Consumo desde frontend con tipado estricto

**Frontend Web (`web/`) y Móvil (`frontend/`):**

Ambos proyectos ya tienen `@uniconnect/shared-types` como dependencia. Después de `pnpm build` en shared-types:

```ts
import { UpdateGroupRequestSchema } from "@uniconnect/shared-types";
import type { z } from "zod";

// Tipo inferido automáticamente desde el esquema Zod
type UpdateGroupRequest = z.infer<typeof UpdateGroupRequestSchema>;

// Uso en un hook o servicio
async function updateGroup(id: string, data: UpdateGroupRequest["body"]) {
  return api.patch(`/api/v1/study-groups/${id}`, data);
}
```

### Resumen del pipeline de generación

```
Zod schemas (packages/shared-types)
    │
    ▼
ApiContract (method + path + request/response Zod schemas)
    │
    ▼
generate-openapi.ts ────► openapi.json ────► Swagger UI (/docs)
    │
    ▼
archive-openapi.ts ────► docs/openapi/v{version}.json (Git)
```

---

## Siguientes pasos recomendados

1. Integrar middleware JWT real en gateway y study-groups.
2. Reemplazar header x-user-id por identidad extraida del token.
3. Completar resources, messaging, profiles-catalog y events con el mismo patron.
4. Agregar tests de integracion por caso de uso critico.