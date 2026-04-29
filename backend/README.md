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

## Siguientes pasos recomendados

1. Integrar middleware JWT real en gateway y study-groups.
2. Reemplazar header x-user-id por identidad extraida del token.
3. Completar resources, messaging, profiles-catalog y events con el mismo patron.
4. Agregar tests de integracion por caso de uso critico.