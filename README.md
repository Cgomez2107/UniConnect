# UniConnect — Monorepo

Aplicación de redes académicas para la Universidad de Caldas.

## Estructura

```
UniConnect/
  backend/          ← Backend monorepo (pnpm workspaces + Turborepo)
    gateway/          API Gateway (puerto 3000)
    services/         Microservicios (auth, study-groups, messaging, etc.)
    shared/           Paquetes compartidos (types, contracts, libs)
  frontend/         ← App móvil (React Native + Expo)
  web/              ← Frontend web (React + Vite)
  packages/         ← Paquetes compartidos entre frontends
    shared-types/     Tipos TypeScript generados desde OpenAPI
    shared-api/       Clientes HTTP tipados
  docs/             ← Documentación técnica
  docker-compose.yml
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 20, TypeScript 5.7, ESM |
| Backend orchestration | pnpm workspaces + Turborepo v2 |
| API Gateway | Node.js nativo (`http.createServer`) |
| Microservicios | Servicios puros, sin framework |
| Frontend mobile | Expo 53, React Native, Expo Router |
| Frontend web | React 19, Vite 8, Tailwind CSS |
| Documentación API | OpenAPI 3.1.0 + Swagger UI |
| Tipos estrictos | Zod + openapi-typescript |

---

## 📊 Arquitectura de Contratos OpenAPI y Tipos Estrictos

### Flujo de Generación

Cada microservicio define sus contratos usando esquemas **Zod**. Estos se convierten automáticamente a una especificación **OpenAPI 3.1.0**, se consolidan en el Gateway y generan tipos **TypeScript** estrictos para todos los consumidores.

```
Zod Schemas (por servicio)
    │
    ▼
OpenAPIBuilder → openapi.partial.json (por servicio)
    │
    ▼
Merge Script → openapi.json consolidado (Gateway)
    │
    ▼
openapi-typescript → api.d.ts (tipos para frontends)
```

### Guía Paso a Paso: Agregar un Nuevo Endpoint

#### 1. Definir esquemas Zod

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

#### 2. Registrar el endpoint

```ts
const builder = new OpenAPIBuilder({
  title: "UniConnect Mi Servicio",
  version: "0.1.0",
  serverUrl: "http://localhost:3100",
  basePath: "/api/v1",
});

builder.addTag("Mi Servicio", "Descripción del servicio");

builder.addEndpoint("/mi-recurso", "post", {
  summary: "Crear un recurso",
  description: "Descripción detallada del endpoint",
  tags: ["Mi Servicio"],
  bodySchema: MiBodySchema,
  responses: {
    201: { description: "Recurso creado exitosamente", schema: MiResponseSchema },
    400: { description: "Error de validación" },
    401: { description: "Token requerido" },
  },
});

builder.toFile("src/openapi/openapi.partial.json");
```

#### 3. Regenerar especificación y tipos

```bash
# Ejecutar build — regenera partials, mergea en Gateway, genera tipos TS
pnpm build
```

El pipeline de Turborepo ejecuta automáticamente:
1. `generate:openapi` — cada servicio genera su partial JSON
2. `merge:openapi` — consolida todos los partials en el Gateway
3. `generate:api-types` — genera `api.d.ts` con tipos estrictos
4. Compilación TypeScript de todos los paquetes

#### 4. Consumir con tipos estrictos

```ts
import type { paths } from "@uniconnect/shared-types";

// Tipo inferido automáticamente desde el contrato OpenAPI
type MiRecursoResponse =
  paths["/api/v1/mi-recurso"]["post"]["responses"][201]["content"]["application/json"];
```

Validación en runtime (opcional):

```ts
import { FetchTransport } from "@uniconnect/shared-api";
import { MiResponseSchema } from "@uniconnect/shared-types";

const transport = new FetchTransport({ baseURL: "http://localhost:3000" });

const response = await transport.request({
  method: "POST",
  url: "/api/v1/mi-recurso",
  body: { name: "Test", email: "test@example.com" },
  responseSchema: MiResponseSchema, // ← validación Zod automática
});
```

Si la respuesta del backend no cumple el esquema, se lanza un `ContractViolationError` impidiendo que datos corruptos lleguen a la UI.

### Ver documentación interactiva

```bash
# Iniciar el Gateway (puerto 3000)
pnpm --filter @uniconnect/gateway dev

# Abrir en navegador
open http://localhost:3000/docs
```

Para documentación más detallada, consultar:
- [`docs/openapi-workflow.md`](./docs/openapi-workflow.md) — guía completa del flujo OpenAPI
- `backend/gateway/src/public/openapi.json` — spec consolidado
- `packages/shared-types/src/generated/api.d.ts` — tipos generados

---

## Backend

### Microservicios

| Servicio | Puerto | Paquete | Descripción |
|----------|--------|---------|-------------|
| Gateway | 3000 | `@uniconnect/gateway` | Enrutamiento y orquestación |
| Auth | 3102 | `@uniconnect/auth` | Autenticación JWT |
| Study Groups | 3101 | `@uniconnect/study-groups` | Grupos de estudio |
| Messaging | 3104 | `@uniconnect/messaging` | Mensajería y encuestas |
| Resources | 3103 | `@uniconnect/resources` | Recursos académicos |
| Profiles Catalog | 3105 | `@uniconnect/profiles-catalog` | Perfiles y catálogo |
| Events | 3106 | `@uniconnect/events` | Eventos académicos |
| Academic Q&A | 3107 | `@uniconnect/academic-qna` | Foro de preguntas |

### Comandos

```bash
cd backend
pnpm install            # Instalar dependencias
pnpm dev                # Iniciar todos los servicios en modo desarrollo
pnpm build              # Compilar producción (regenera contratos OpenAPI)
pnpm --filter @uniconnect/gateway dev   # Solo el Gateway
docker-compose up       # Entorno completo con Docker
```

---

## Frontend Mobile

Stack: React Native, Expo, Expo Router, Zustand, TypeScript

```bash
cd frontend
npm install
npx expo start
```

---

## Frontend Web

Stack: React, Vite, Tailwind CSS, Zustand, TypeScript

```bash
cd web
npm install
npm run dev
```

---

## Documentación API

- Especificación OpenAPI: `http://localhost:3000/api/v1/openapi.json`
- Swagger UI: `http://localhost:3000/docs`
- Guía de contratos: [`docs/openapi-workflow.md`](./docs/openapi-workflow.md)
