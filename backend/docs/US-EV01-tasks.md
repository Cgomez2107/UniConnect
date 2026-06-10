# US-EV01: Protección de Rutas Admin — Desglose de Tareas

## Bloque 1: Modificación del JWT en Auth Service

### Tarea 1.1 — Añadir `role` al payload del JWT

- **Archivo:** `backend/services/auth/src/infrastructure/jwt/JWTService.ts`
- **Cambio:**
  1. Añadir `role?: string` a la interfaz `JWTPayload`
  2. Modificar `generateTokens(userId, role?)` para incluir `role` en el payload si está presente
  3. No romper la firma existente (parámetro opcional)
- **Tests:**
  - Llamar `generateTokens("uuid", "admin")` → decodificar el JWT resultante → verificar `payload.role === "admin"`
  - Llamar `generateTokens("uuid")` sin role → verificar que `payload.role` sea `undefined`

### Tarea 1.2 — Propagar `role` en SignInUseCase

- **Archivo:** `backend/services/auth/src/application/use-cases/SignInUseCase.ts`
- **Cambio:** En `generateAuthResponse()`, pasar `role` a `this.jwtService.generateTokens(userId, role)`
- **Tests:**
  - Mockear `JWTService`
  - Ejecutar `execute()` con credenciales válidas
  - Verificar que `generateTokens` se llamó con `(userId, role)`

### Tarea 1.3 — Propagar `role` en SignUpUseCase

- **Archivo:** `backend/services/auth/src/application/use-cases/SignUpUseCase.ts`
- **Cambio:** Pasar `user.role` a `this.jwtService.generateTokens(user.id, user.role)`
- **Tests:**
  - Mockear `JWTService`
  - Ejecutar `execute()` con datos de registro válidos
  - Verificar que `generateTokens` se llamó con `"estudiante"`

### Tarea 1.4 — Propagar `role` en RefreshTokenUseCase

- **Archivo:** `backend/services/auth/src/application/use-cases/RefreshTokenUseCase.ts`
- **Cambio:** El `user` ya se obtiene via `findById` (retorna `User` con `role`). Pasar `user.role` a `generateTokens`
- **Tests:**
  - Mockear repositorio para que retorne un usuario con `role: "admin"`
  - Ejecutar `execute()`
  - Verificar que `generateTokens` reciba `"admin"`

## Bloque 2: Gateway — Verificación de Firma JWT

### Tarea 2.1 — Reemplazar decode sin firma por verify

- **Archivo:** `backend/gateway/src/middleware/JWTMiddleware.ts`
- **Cambio:**
  1. Sustituir el decode manual de Base64Url por `jwt.verify(token, this.accessTokenSecret)`
  2. Asegurar que `payload.role` se extraiga correctamente y se incluya en el `JWTPayload` retornado
- **Tests:**
  - Token válido firmado → retorna payload con `sub` y `role`
  - Token sin firma → 401
  - Token expirado → 401
  - Token malformado → 401

### Tarea 2.2 — Añadir dependencia `jsonwebtoken`

- **Archivo:** `backend/gateway/package.json`
- **Cambio:** Añadir `"jsonwebtoken": "^9.0.0"` a `dependencies`
- **Tests:** Ninguno (solo package.json)

## Bloque 3: Middleware de Autorización Compartido

### Tarea 3.1 — Crear `requireRole()` en shared

- **Archivo:** **NUEVO** `backend/shared/middleware/adminGuard.ts`
- **Cambio:** Implementar función `requireRole(requiredRole: AdminLevel)` que:
  1. Lee `req.headers["x-user-role"]`
  2. Si ausente → lanza `AuthorizationError("Acceso restringido a super_admin")`
  3. Si presente pero insuficiente → lanza `AuthorizationError("Acceso restringido a super_admin")`
  4. Registra intento fallido con `userId`, `ruta`, `timestamp`
  5. Si ok → retorna `true`
- **Tests:**
  - **Escenario 1:** Sin header `x-user-role` → `AuthorizationError`
  - **Escenario 2:** Header `x-user-role: estudiante` + `requireRole("admin")` → `AuthorizationError`
  - **Escenario 3:** Header `x-user-role: admin` + `requireRole("admin")` → `true`
  - **Escenario 4:** Header `x-user-role: super_admin` + `requireRole("admin")` → `true` (super_admin hereda permisos admin)

### Tarea 3.2 — Verificar `AuthorizationError`

- **Archivo:** `backend/shared/libs/errors/AuthorizationError.ts`
- **Cambio:** Verificar que el `statusCode` sea 403 y el constructor acepte mensaje personalizado
- **Tests:**
  - Crear instancia con `new AuthorizationError("Acceso restringido")`
  - Verificar `error.statusCode === 403`
  - Verificar `error.message === "Acceso restringido"`

## Bloque 4: Integración en Events Service

### Tarea 4.1 — Reemplazar `isAdminUser` por `requireRole`

- **Archivo:** `backend/services/events/src/interfaces/http/middlewares/isAdminUser.ts`
- **Cambio:** Reemplazar la implementación actual (DB query) por una llamada a `requireRole("admin")` del módulo compartido. Mantener la misma firma de función para no romper llamadas existentes.
- **Tests:**
  - Mockear `req.headers["x-user-role"] = "admin"` → función retorna `true`
  - Mockear `req.headers["x-user-role"] = "estudiante"` → función lanza `AuthorizationError`

### Tarea 4.2 — Validar manejo de errores en controlador

- **Archivo:** `backend/services/events/src/interfaces/http/controllers/EventsController.ts`
- **Cambio:** Ninguno si ya captura `AuthorizationError` en el `catch`. Solo validar que los métodos `update`, `delete`, `publish`, `cancel`, `finish` propaguen el error correctamente.
- **Tests:** Prueba de integración que envía request sin rol admin a rutas protegidas y recibe 403 con mensaje exacto.

### Tarea 4.3 — Sin cambios en getActorUserId

- **Archivo:** `backend/services/events/src/interfaces/http/middlewares/getActorUserId.ts`
- **Cambio:** Ninguno. Ya funciona correctamente leyendo `x-user-id`.

## Bloque 5: Tests de Integración

### Tarea 5.1 — Suite de tests para admin guard

- **Archivo:** **NUEVO** `backend/services/events/tests/integration/admin-guard.spec.ts`
- **Casos:**
  1. Request exitoso con `x-user-role: admin` → 200
  2. Request sin token → 401
  3. Request con token pero `x-user-role: estudiante` → 403 con `"Acceso restringido a super_admin"`
  4. Request sin header `x-user-role` → 403 con mismo mensaje
  5. Verificar que **no** se ejecute query DB de `profiles` durante la validación admin
- **Enfoque:** Usar `createEventsServer` con repositorios mockeados. Inyectar headers manualmente.

## Orden de Implementación Sugerido

```
1. AuthorizationError (verificar que ya existe con status 403)
2. adminGuard.ts (crear middleware compartido + tests unitarios)
3. JWTService.ts (añadir role al payload + tests)
4. SignInUseCase.ts (propagar role + tests)
5. SignUpUseCase.ts (propagar role + tests)
6. RefreshTokenUseCase.ts (propagar role + tests)
7. JWTMiddleware.ts (firma JWT en gateway + tests)
8. isAdminUser.ts (reemplazar por requireRole + tests)
9. admin-guard.spec.ts (tests de integración)
```
