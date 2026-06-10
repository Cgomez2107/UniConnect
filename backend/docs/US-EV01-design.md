# US-EV01: Protección de Rutas Admin — Documento de Diseño

## 1. Diagnóstico de la Situación Actual

| Componente | Estado actual | Problema |
|---|---|---|
| `JWTService.generateTokens()` | Payload: `{ sub, iat, exp, jti }` | **No incluye `role`** |
| Gateway `x-user-role` header | `payload.role` → siempre `undefined` | Headers muertos porque el JWT no trae el rol |
| `isAdminUser()` en events | Hace `SELECT role FROM profiles WHERE id = $1` | **Consulta DB por cada request** — viola el requisito de optimización |
| `getActorUserId()` | Lee `x-user-id` header | Funciona correctamente |

## 2. Modificación del JWT (auth service)

**Archivo:** `backend/services/auth/src/infrastructure/jwt/JWTService.ts`

Se añade `role` al payload del JWT y como parámetro en `generateTokens()`:

```typescript
export interface JWTPayload {
  sub: string;
  role?: string;  // ← NUEVO (opcional para retrocompatibilidad)
  iat: number;
  exp: number;
  jti: string;
}

generateTokens(userId: string, role?: string): { ... }
```

### Puntos de propagación

| Caso de uso | Rol que se pasa | Archivo |
|---|---|---|
| `SignInUseCase.generateAuthResponse()` | `role` del usuario autenticado | `SignInUseCase.ts` |
| `SignUpUseCase` | `"estudiante"` (rol por defecto al registrarse) | `SignUpUseCase.ts` |
| `RefreshTokenUseCase` | `user.role` obtenido del repositorio | `RefreshTokenUseCase.ts` |

**Validación retroactiva:** Los tokens antiguos (sin `role`) no causan error — el campo es opcional. El guard lo interpretará como `undefined` → 403 hasta que el usuario renueve su token.

## 3. Inyección en el Gateway

**Archivo:** `backend/gateway/src/app/createGatewayServer.ts`

El gateway **ya tiene** el código que propaga el rol. Después de la modificación del JWT, cuando el token incluya `role`, este header se poblara automáticamente:

```typescript
req.headers["x-user-id"] = payload.sub;
if (payload.role) req.headers["x-user-role"] = payload.role;
```

**Propuesta adicional:** Reemplazar el decode sin verificación de firma en `JWTMiddleware.authenticate()` por `jwt.verify()` usando `jsonwebtoken`.

## 4. Middleware de Autorización Compartido (AdminGuard)

**Archivo nuevo:** `backend/shared/middleware/adminGuard.ts`

```typescript
import type { IncomingMessage, ServerResponse } from "node:http";
import { AuthorizationError } from "../libs/errors/AuthorizationError.js";

export type AdminLevel = "admin" | "super_admin";

export function requireRole(requiredRole: AdminLevel) {
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const userRole = req.headers["x-user-role"];

    if (!userRole || typeof userRole !== "string") {
      throw new AuthorizationError("Acceso restringido a super_admin");
    }

    if (requiredRole === "super_admin" && userRole !== "super_admin") {
      throw new AuthorizationError("Acceso restringido a super_admin");
    }

    if (requiredRole === "admin" && userRole !== "admin" && userRole !== "super_admin") {
      throw new AuthorizationError("Acceso restringido a super_admin");
    }

    return true;
  };
}
```

**Comportamiento:**
- Header `x-user-role` ausente → `AuthorizationError` (HTTP 403)
- Rol insuficiente → `AuthorizationError` (HTTP 403)
- Mensaje exacto en ambos casos: `'Acceso restringido a super_admin'`
- Rol suficiente → `true`, el request continúa

## 5. Log de Auditoría

**Estrategia:** Logging asíncrono con `console.log` estructurado en formato JSON (mismo patrón usado en gateway y servicios).

```typescript
function logFailedAttempt(userId: string | null, route: string): void {
  console.log(JSON.stringify({
    service: "gateway",
    level: "warn",
    message: "Acceso restringido — intento de admin sin permisos",
    userId: userId ?? "unknown",
    ruta: route,
    timestamp: new Date().toISOString(),
  }));
}
```

## 6. Optimización de BD — Zero DB Queries

**Confirmación:** El rol se resuelve **100% desde el JWT**. Sin `SELECT` a PostgreSQL.

Flujo completo:
1. Auth service genera JWT con `{ sub, role, iat, exp, jti }`
2. Gateway extrae el JWT, verifica firma, pasa `x-user-role` al header
3. Events service lee `req.headers["x-user-role"]`
4. `isAdminUser.ts` se reemplaza por el nuevo guard compartido

## 7. Diagrama de Flujo

```
Cliente               Gateway                  Auth Service           Events Service
  │                     │                          │                      │
  │  POST /auth/signin  │                          │                      │
  │────────────────────►│                          │                      │
  │                     │  POST /auth/signin        │                      │
  │                     │─────────────────────────►│                      │
  │                     │                          │  generateTokens()    │
  │                     │                          │  con {sub, role,..}  │
  │                     │◄─────────────────────────│                      │
  │◄────────────────────│                          │                      │
  │                     │                          │                      │
  │  GET /api/v1/events │                          │                      │
  │  (Bearer <JWT>)     │                          │                      │
  │────────────────────►│                          │                      │
  │                     │  authenticate(JWT)       │                      │
  │                     │  → payload.sub           │                      │
  │                     │  → payload.role          │                      │
  │                     │  set headers:            │                      │
  │                     │    x-user-id = sub       │                      │
  │                     │    x-user-role = role    │                      │
  │                     │                          │                      │
  │                     │  GET /api/v1/events      │                      │
  │                     │  + x-user-role: admin    │                      │
  │                     │───────────────────────────────────────────────►│
  │                     │                          │                      │
  │                     │                          │  requireRole()       │
  │                     │                          │  → true              │
  │                     │                          │                      │
  │◄────────────────────│                          │                      │
```

## 8. Archivos Afectados

| Acción | Archivo |
|---|---|
| ✏️ Modificar | `backend/services/auth/src/infrastructure/jwt/JWTService.ts` |
| ✏️ Modificar | `backend/services/auth/src/application/use-cases/SignInUseCase.ts` |
| ✏️ Modificar | `backend/services/auth/src/application/use-cases/SignUpUseCase.ts` |
| ✏️ Modificar | `backend/services/auth/src/application/use-cases/RefreshTokenUseCase.ts` |
| ✏️ Modificar | `backend/gateway/src/middleware/JWTMiddleware.ts` |
| ✏️ Modificar | `backend/gateway/package.json` |
| 🆕 Crear | `backend/shared/middleware/adminGuard.ts` |
| ✏️ Modificar | `backend/services/events/src/interfaces/http/middlewares/isAdminUser.ts` |
| ✏️ Modificar | `backend/services/events/src/interfaces/http/controllers/EventsController.ts` |
| 🆕 Crear | `backend/services/events/tests/integration/admin-guard.spec.ts` |
