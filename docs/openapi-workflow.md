# OpenAPI Workflow — UniConnect

## Arquitectura del Flujo

```
Zod Schemas (por servicio)
    │
    ▼
OpenAPIBuilder (genera partial JSON por servicio)
    │
    ▼
Merge Script (gateway/scripts/merge-openapi.ts)
    │
    ▼
openapi.json consolidado (gateway/src/public/)
    │
    ▼
openapi-typescript CLI (genera tipos TS)
    │
    ▼
api.d.ts (packages/shared-types/src/generated/)
```

El flujo convierte esquemas **Zod** en especificación **OpenAPI 3.1.0** y luego en tipos **TypeScript** estrictos, todo de forma programática y sin depender de generadores tipo swagger-jsdoc.

---

## Componentes del Sistema

### 1. OpenAPIBuilder — `backend/shared/contracts/openapi/builder.ts`

Clase utilitaria que construye un objecto OpenAPI 3.1.0 a partir de esquemas Zod y opciones de configuración.

**Constructor:**
```ts
const builder = new OpenAPIBuilder({
  title: "UniConnect Auth Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3102",
  basePath: "/api/v1",
});
```

**Métodos principales:**
- `addTag(name, description)` — registra un tag para agrupar endpoints
- `addEndpoint(path, method, config)` — registra una ruta con body, query, params y responses
- `addZodSchema(name, schema)` — registra un schema Zod con nombre explícito (opcional, el builder genera nombres automáticos)
- `toFile(relativePath)` — escribe el partial JSON a disco

**Manejo de `:param` en paths:**
```ts
builder.addEndpoint("/profiles/:id", "get", { ... });
// Se convierte automáticamente a /profiles/{id} en OpenAPI
```

### 2. Script `generate:openapi` — por servicio

Cada servicio backend tiene un script `generate:openapi` en su `package.json`:

```json
"generate:openapi": "tsx src/openapi/index.ts"
```

Este script:
1. Importa `OpenAPIBuilder` desde `../../../../shared/contracts/openapi/index.js`
2. Define schemas Zod inline o importa desde `@uniconnect/shared-types`
3. Registra endpoints con `builder.addEndpoint()`
4. Ejecuta `builder.toFile("src/openapi/openapi.partial.json")`

**Ubicación:** cada servicio tiene su archivo en `backend/services/{nombre}/src/openapi/index.ts`

### 3. Merge Script — `backend/gateway/scripts/merge-openapi.ts`

Script que:
1. Busca `services/*/src/openapi/openapi.partial.json`
2. Mergea paths, components.schemas, tags de todos los partials
3. Lee la versión desde `backend/package.json`
4. Escribe el spec consolidado en `backend/gateway/src/public/openapi.json`

Ejecución:
```bash
pnpm --filter @uniconnect/gateway merge:openapi
```

### 4. Servicio en Gateway — `backend/gateway/src/app/createGatewayServer.ts`

El Gateway sirve dos rutas públicas:
- `GET /api/v1/openapi.json` — spec OpenAPI completo en JSON
- `GET /docs` (y `/docs/*`) — Swagger UI con el spec cargado

```ts
const PUBLIC_PATHS = new Set([
  "/docs", "/docs/", "/api/v1/openapi.json", "/favicon.ico",
]);
```

### 5. Generación de Tipos — `packages/shared-types/scripts/generate-api-types.ts`

Usa `openapi-typescript` CLI (v7.13.0) para generar un archivo `api.d.ts`:

```bash
pnpm --filter @uniconnect/shared-types generate:api-types
```

El resultado se escribe en `packages/shared-types/src/generated/api.d.ts`.

Los tipos se exportan desde `packages/shared-types/src/index.ts`:

```ts
export type { paths, components, operations } from "./generated/api.js";
```

### 6. Validación Runtime en FetchTransport — `packages/shared-api/src/transport/fetchTransport.ts`

El `FetchTransport` acepta un `responseSchema` opcional en `RequestOptions`:

```ts
interface RequestOptions {
  // ...
  responseSchema?: z.ZodTypeAny;
}
```

Si se provee, antes de retornar la respuesta ejecuta `schema.parse(data)`. Si la respuesta del backend no cumple el contrato Zod, lanza un `ContractViolationError` con los issues de validación.

```ts
class ContractViolationError extends Error {
  public readonly method: string;
  public readonly url: string;
  public readonly zodIssues: ZodIssue[];
}
```

Esto impide que datos malformados se propaguen a capas superiores (stores, componentes UI, etc.).

---

## Pipeline Turborepo

En `backend/turbo.json`:

```json
{
  "pipeline": {
    "generate:openapi": { "cache": false },
    "merge:openapi": {
      "dependsOn": [
        "auth#generate:openapi",
        "study-groups#generate:openapi",
        "academic-qna#generate:openapi",
        "messaging#generate:openapi",
        "profiles-catalog#generate:openapi",
        "resources#generate:openapi",
        "events#generate:openapi"
      ]
    },
    "generate:api-types": {
      "dependsOn": ["^merge:openapi"]
    },
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## Guía Rápida: Agregar un Nuevo Endpoint

### Paso 1: Definir esquemas Zod

En el archivo `src/openapi/index.ts` del servicio correspondiente:

```ts
import { z } from "zod";
import { OpenAPIBuilder } from "../../../../shared/contracts/openapi/index.js";

const MiBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
});

const MiResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
```

### Paso 2: Registrar el endpoint

```ts
const builder = new OpenAPIBuilder({
  title: "UniConnect Mi Servicio",
  version: "0.1.0",
  serverUrl: "http://localhost:3100",
  basePath: "/api/v1",
});

builder.addTag("Mi Servicio", "Descripción");

builder.addEndpoint("/mi-recurso", "post", {
  summary: "Crear un recurso",
  description: "Descripción detallada",
  tags: ["Mi Servicio"],
  bodySchema: MiBodySchema,
  responses: {
    201: {
      description: "Recurso creado exitosamente",
      schema: MiResponseSchema,
    },
    400: {
      description: "Error de validación",
    },
    401: {
      description: "Token requerido",
    },
  },
});

builder.toFile("src/openapi/openapi.partial.json");
```

### Paso 3: Regenerar especificación y tipos

```bash
# 1. Generar partial del servicio
pnpm --filter @uniconnect/mi-servicio generate:openapi

# 2. Mergear todos los partials en el Gateway
pnpm --filter @uniconnect/gateway merge:openapi

# 3. Regenerar tipos TypeScript
pnpm --filter @uniconnect/shared-types generate:api-types
```

### Paso 4: Consumir con tipos estrictos

```ts
import type { paths } from "@uniconnect/shared-types";

// El tipo de la respuesta está disponible automáticamente
type MiRecursoResponse = paths["/api/v1/mi-recurso"]["post"]["responses"][201]["content"]["application/json"];
```

Opcionalmente, validar en runtime:

```ts
import { z } from "zod";
import { FetchTransport } from "@uniconnect/shared-api";

const transport = new FetchTransport({ baseURL: "http://localhost:3000" });

const response = await transport.request({
  method: "POST",
  url: "/api/v1/mi-recurso",
  body: { name: "Test", email: "test@example.com" },
  responseSchema: MiResponseSchema, // ← validación automática
});
```

---

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm --filter @uniconnect/auth generate:openapi` | Genera partial de Auth |
| `pnpm --filter @uniconnect/gateway merge:openapi` | Mergea todos los partials |
| `pnpm --filter @uniconnect/shared-types generate:api-types` | Regenera tipos TS |
| `pnpm --filter @uniconnect/shared-types build` | Build completo (incluye prebuild → generate) |
| `curl http://localhost:3000/api/v1/openapi.json` | Ver spec servido |
| `curl http://localhost:3000/docs` | Ver Swagger UI en navegador |

---

## Vista General del Flujo

```
[Dev] Escribe Zod schemas + addEndpoint() en src/openapi/index.ts
  │
  ▼
[Dev] Ejecuta: pnpm --filter @uniconnect/{service} generate:openapi
  │
  ▼
[Script] Escribe src/openapi/openapi.partial.json
  │
  ▼
[Dev/Turbo] Ejecuta: pnpm --filter @uniconnect/gateway merge:openapi
  │
  ▼
[Merge Script] Lee todos los partials, consolida paths/schemas/tags
  │
  ▼
[Merge Script] Escribe gateway/src/public/openapi.json
  │
  │   ┌── Sirve en GET /api/v1/openapi.json
  │   └── Sirve Swagger UI en GET /docs
  │
  ▼
[Dev/Turbo] Ejecuta: pnpm --filter @uniconnect/shared-types generate:api-types
  │
  ▼
[openapi-typescript] Lee openapi.json → genera api.d.ts con paths/components
  │
  ▼
[shared-types] Exporta types: paths, components, operations
  │
  ▼
[Packages consumidores] Importan tipos y usan FetchTransport.responseSchema
```

---

## Solución de Problemas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| El partial no se genera | `generate:openapi` no ejecutado | `pnpm --filter @uniconnect/{service} generate:openapi` |
| Path duplicado en merge | Dos servicios registran el mismo path | Verificar `addEndpoint` en cada servicio |
| Schema no aparece en tipos | El merge no incluyó el partial | Verificar que `openapi.partial.json` exista en `services/*/src/openapi/` |
| `ContractViolationError` en runtime | La API devolvió datos que no cumplen el Zod schema | Verificar backend vs schema; actualizar schema si cambió el contrato |
| Swagger UI no carga | CDN bloqueada o spec no servido | Verificar `GET /api/v1/openapi.json`; probar en incógnito |
