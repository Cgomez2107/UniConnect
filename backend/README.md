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

## Siguientes pasos recomendados

1. Integrar middleware JWT real en gateway y study-groups.
2. Reemplazar header x-user-id por identidad extraida del token.
3. Completar resources, messaging, profiles-catalog y events con el mismo patron.
4. Agregar tests de integracion por caso de uso critico.