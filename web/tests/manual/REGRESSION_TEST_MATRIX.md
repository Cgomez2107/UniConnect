# 📋 MATRIZ DE CASOS DE PRUEBA DE REGRESIÓN FUNCIONAL - Migración Expo → Vite (Sprint 3)

**Tipo**: Pruebas Manuales / Funcionales End-to-End  
**Cobertura**: Autenticación, Admin Panel, Chat Grupal, Solicitudes de Estudio, Navegación  
**Objetivo**: Validar paridad funcional 100% entre aplicación legacy (Expo) y nueva (Vite) antes de fase de automatización  

---

```
Módulo      → Épica funcional (AUTH, ADMIN, CHAT, SOLICITUDES, etc.)
Pre-req     → Datos/estado necesarios antes de ejecutar
```

---

## 🔐 MÓDULO: AUTENTICACIÓN (AUTH)

### 🟢 HAPPY PATHS


#### **REG-AUTH-02: Login Exitoso con Credenciales Válidas (Admin)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario registrado en BD con role='admin'; app abierta en `/login` |
| **Acción** | 1. Ingresa email admin (ej. `admin@ucaldas.edu.co`)<br>2. Ingresa password correcto<br>3. Click en botón "Ingresar" |
| **Resultado Esperado** | ✅ POST `/auth/signin` retorna HTTP 200<br>✅ Token guardado en `localStorage.accessToken`<br>✅ Usuario redirigido a `/admin` (home para admins)<br>✅ Panel de Admin visible con lista de grupos<br>✅ Nombre del admin mostrado en navbar |
| **Obs** | Verificar que admin ve `/admin` automáticamente (no `/solicitudes`) |

- [ ] **REG-AUTH-02**: Ejecutado y Validado ✅

---

#### **REG-AUTH-03: Restaurar Sesión (App Reload con Token Válido)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado (REG-AUTH-01 o 02 completado); token en `localStorage` |
| **Acción** | 1. Recarga la página (F5 o Cmd+R)<br>2. Observa el comportamiento |
| **Resultado Esperado** | ✅ GET `/auth/session` ejecutado automáticamente<br>✅ Usuario mantenido autenticado (no redirigido a `/login`)<br>✅ Pantalla visible sin prompts de login<br>✅ Nombre del usuario visible en navbar<br>✅ Si token expirado: redirige a `/login` |
| **Obs** | Token debe ser válido; si expiración falla, debe show "401 Unauthorized" en console |

- [x] **REG-AUTH-03**: Ejecutado y Validado ✅

---



#### **REG-AUTH-05: OAuth Google Signin (Happy Path)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Happy Path |
| **Pre-req** | App abierta en `/login`; credenciales Google válidas con dominio permitido |
| **Acción** | 1. Click en botón "Ingresar con Google"<br>2. Popup o redireccionamiento a Google Auth<br>3. Ingresa credenciales Google (email @ucaldas.edu.co)<br>4. Autoriza acceso a UniConnect |
| **Resultado Esperado** | ✅ Popup cierra o redirige desde `/oauth-callback`<br>✅ POST `/auth/signin` ejecutado con credenciales OAuth<br>✅ Token guardado en `localStorage`<br>✅ Usuario redirigido a home según rol (admin → `/admin`, estudiante → `/solicitudes`)<br>✅ Nombre del usuario visible en navbar |
| **Obs** | Si dominio NO es @ucaldas, error debe ser "Usa tu correo institucional" |

- [x] **REG-AUTH-05**: Ejecutado y Validado ✅

---

#### **REG-AUTH-06: Navegación a Ruta Protegida Sin Token (Redirige a Login)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Happy Path (Guardia) |
| **Pre-req** | App abierta en navegador; NO hay token en `localStorage` |
| **Acción** | 1. Accede directamente a ruta protegida<br>   - Ej: `http://localhost:5173/admin`<br>   - Ej: `http://localhost:5173/solicitudes` |
| **Resultado Esperado** | ✅ Usuario redirigido automáticamente a `/login`<br>✅ No hay error 403 o 401 en red (redireccionamiento en cliente)<br>✅ Pantalla de login visible |
| **Obs** | Verifica que `PrivateRoute` guard funciona antes de hacer fetch de datos |

- [x] **REG-AUTH-06**: Ejecutado y Validado ✅

---

### 🔴 EDGE CASES / FLUJOS ALTERNOS

#### **REG-AUTH-07: Login con Email NO Registrado**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | Email no existe en BD |
| **Acción** | 1. Ingresa email inexistente (ej. `noexiste@test.com`)<br>2. Ingresa cualquier password<br>3. Click "Ingresar" |
| **Resultado Esperado** | ✅ POST `/auth/signin` retorna HTTP 401 o 400<br>✅ Error mostrado en UI: "Email o contraseña incorrectos"<br>✅ Usuario NO logueado; sigue en `/login`<br>✅ `localStorage` vacío (sin token)<br>✅ No hay estado residual |
| **Obs** | Validar que mensaje de error es genérico (no especifica si email/password es el problema) |

- [ ] **REG-AUTH-07**: Ejecutado y Validado ✅

---

#### **REG-AUTH-08: Login con Password Incorrecto**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | Usuario registrado; email válido pero password es incorrecto |
| **Acción** | 1. Ingresa email correcto<br>2. Ingresa password INCORRECTO<br>3. Click "Ingresar" |
| **Resultado Esperado** | ✅ POST `/auth/signin` retorna HTTP 401<br>✅ Error mostrado: "Email o contraseña incorrectos"<br>✅ Sigue en `/login`, NO hay redirección<br>✅ `localStorage` vacío |
| **Obs** | Mensaje debe ser idéntico a REG-AUTH-07 (sin diferenciar email vs password) |

- [ ] **REG-AUTH-08**: Ejecutado y Validado ✅

---

#### **REG-AUTH-09: Login con Email Vacío**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | App en `/login` |
| **Acción** | 1. Deja email vacío<br>2. Ingresa password cualquiera<br>3. Intenta hacer click en "Ingresar" (si botón está enabled) o presiona Enter |
| **Resultado Esperado** | ✅ Validación de cliente: error "Email es requerido"<br>✅ NO hace POST al servidor<br>✅ Botón "Ingresar" puede estar disabled (sin intentar request) |
| **Obs** | Validación de frontend antes de POST |

- [x] **REG-AUTH-09**: Ejecutado y Validado ✅

---

#### **REG-AUTH-10: Login con Password Vacío**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | App en `/login` |
| **Acción** | 1. Ingresa email válido<br>2. Deja password vacío<br>3. Intenta click "Ingresar" |
| **Resultado Esperado** | ✅ Validación de cliente: error "Contraseña es requerida"<br>✅ NO hace POST<br>✅ Botón disabled o con validación de frontend |
| **Obs** | N/A |

- [x] **REG-AUTH-10**: Ejecutado y Validado ✅

---

#### **REG-AUTH-11: Token Expirado Durante Sesión**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | Usuario logueado; token expirará en muy poco tiempo (o manipular manualmente en DevTools) |
| **Acción** | 1. Usuario logueado y navegando<br>2. Espera que token expire (o edita `localStorage.accessToken` para invalidar)<br>3. Intenta hacer una acción que requiera API (ej. cargar grupos en Admin) |
| **Resultado Esperado** | ✅ Endpoint retorna HTTP 401<br>✅ Interceptor Axios detecta 401 y redirige a `/login`<br>✅ Token y datos de sesión eliminados de `localStorage`<br>✅ Mensaje claro: "Tu sesión expiró, por favor inicia sesión de nuevo" (opcional) |
| **Obs** | Verifica que `localStorage` se limpie después de 401 |

- [ ] **REG-AUTH-11**: Ejecutado y Validado ✅

---

#### **REG-AUTH-12: Login con Email Formato Inválido**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | App en `/login` |
| **Acción** | 1. Ingresa email SIN @: ej. `estudiante.ucaldas.edu.co`<br>2. Ingresa password<br>3. Intenta "Ingresar" |
| **Resultado Esperado** | ✅ Validación cliente: error "Email debe ser válido"<br>✅ NO hace POST al backend<br>✅ Botón disabled o con error visual |
| **Obs** | Validación de frontend (regex o validator lib) |

- [ ] **REG-AUTH-12**: Ejecutado y Validado ✅

---

#### **REG-AUTH-13: Acceso a `/admin` como Usuario Estudiante**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | Usuario logueado con role='estudiante'; token válido en localStorage |
| **Acción** | 1. Navega directamente a `http://localhost:5173/admin`<br>   (O intenta click en link de admin si está visible) |
| **Resultado Esperado** | ✅ GET `/auth/session` valida el token<br>✅ `PrivateRoute` verifica `requiredRole="admin"`<br>✅ Usuario tiene role='estudiante' (NO es admin)<br>✅ Redirigido a `/` (home principal)<br>✅ NO ve panel de admin; no hay error 403 <br>✅ Se redirige según su rol: a `/solicitudes` |
| **Obs** | Validación debe ser en cliente (sin exponer rutas admin) |

- [ ] **REG-AUTH-13**: Ejecutado y Validado ✅

---

#### **REG-AUTH-14: Intento OAuth con Email NO Institucional**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | App en `/login` |
| **Acción** | 1. Click "Ingresar con Google"<br>2. Popup Google Auth<br>3. Ingresa email NO @ucaldas (ej. @gmail.com)<br>4. Intenta autorizar |
| **Resultado Esperado** | ✅ Backend (`/auth/signin`) rechaza con HTTP 400 o 403<br>✅ Error mostrado en UI: "Debes usar tu correo institucional (@ucaldas.edu.co)"<br>✅ Usuario redirigido a `/oauth-callback?error=domain_rejected`<br>✅ Pantalla de login visible de nuevo; token NO generado |
| **Obs** | Validación de dominio en backend; error debe ser amigable |

- [x] **REG-AUTH-14**: Ejecutado y Validado ✅

---

#### **REG-AUTH-15: Login con Conexión de Red Lenta/Offline**

| Campo | Detalle |
|-------|---------|
| **Módulo** | AUTH |
| **Tipo** | Edge Case |
| **Pre-req** | Simular offline: DevTools → Network → throttle a "Offline" |
| **Acción** | 1. App en `/login`<br>2. Ingresa credenciales<br>3. Click "Ingresar" (sin conexión) |
| **Resultado Esperado** | ✅ Axios interceptor detecta error de conexión<br>✅ Error mostrado: "No hay conexión a internet"<br>✅ User sigue en `/login`<br>✅ Opción de reintentar disponible |
| **Obs** | Manejo de timeout en axios client |

- [ ] **REG-AUTH-15**: Ejecutado y Validado ✅

---

## 👨‍💼 MÓDULO: PANEL ADMINISTRADOR (ADMIN)

### 🟢 HAPPY PATHS

#### **REG-ADMIN-01: Ver Panel de Admin con Listado de Grupos de Estudio**

| Campo | Detalle |
|-------|---------|
| **Módulo** | ADMIN |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado con role='admin'; existen grupos en BD |
| **Acción** | 1. Accede a `/admin`<br>2. Página carga completamente |
| **Resultado Esperado** | ✅ GET `/study-groups` ejecutado automáticamente<br>✅ Retorna HTTP 200 con array de grupos<br>✅ Panel visible con título "Admin Panel"<br>✅ Tabla/lista de grupos mostrando:<br>   - Nombre del grupo<br>   - Asignatura<br>   - Cantidad de miembros<br>✅ Cada grupo es clickeable (preparar para REG-ADMIN-02) |
| **Obs** | Verificar que datos son actuales (no stale); sin errores en console |

- [ ] **REG-ADMIN-01**: Ejecutado y Validado ✅

---

#### **REG-ADMIN-02: Hacer Click en Grupo para Ver Detalles (Preparación)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | ADMIN |
| **Tipo** | Happy Path |
| **Pre-req** | REG-ADMIN-01 completado; panel visible con grupos |
| **Acción** | 1. Hace click en un grupo de la lista |
| **Resultado Esperado** | ✅ Navega a `/study-groups/:id` (si existe en Vite)<br>✅ O abre modal/sheet con detalles del grupo<br>✅ Muestra:<br>   - Nombre grupo<br>   - Miembros actuales<br>   - Descripción/asignatura<br>   - Opción de editar o eliminar (si está implementado)<br>✅ No hay errores HTTP |
| **Obs** | Si en Vite NO existe esta ruta detalle, marcar como "NO IMPLEMENTADO" |

- [ ] **REG-ADMIN-02**: Ejecutado y Validado ✅

---

#### **REG-ADMIN-03: Admin Puede Logout desde Panel**

| Campo | Detalle |
|-------|---------|
| **Módulo** | ADMIN |
| **Tipo** | Happy Path |
| **Pre-req** | Admin en `/admin` |
| **Acción** | 1. Ubica botón "Logout" o "Cerrar Sesión" (navbar)<br>2. Click en logout |
| **Resultado Esperado** | ✅ Mismo resultado que REG-AUTH-04<br>✅ Token eliminado<br>✅ Redirigido a `/login` |
| **Obs** | Verifica que no hay token residual |

- [ ] **REG-ADMIN-03**: Ejecutado y Validado ✅

---

#### **REG-ADMIN-04: Panel Admin NO Visible para Estudiante**

| Campo | Detalle |
|-------|---------|
| **Módulo** | ADMIN |
| **Tipo** | Happy Path (Guardia) |
| **Pre-req** | Usuario logueado con role='estudiante' |
| **Acción** | 1. Intenta acceder a `/admin`<br>   (Directamente o via URL) |
| **Resultado Esperado** | ✅ Redirigido a `/` o `/solicitudes`<br>✅ Panel admin NO cargó ni se vio<br>✅ GET `/study-groups` NO se ejecutó<br>✅ No hay error en consola; redireccionamiento limpio |
| **Obs** | Verificar que `PrivateRoute` guard funciona |

- [ ] **REG-ADMIN-04**: Ejecutado y Validado ✅

---

### 🔴 EDGE CASES

#### **REG-ADMIN-05: Panel Admin Cargado pero Sin Grupos (Empty State)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | ADMIN |
| **Tipo** | Edge Case |
| **Pre-req** | Usuario admin; NO existen grupos en BD (o fueron eliminados) |
| **Acción** | 1. Accede a `/admin` |
| **Resultado Esperado** | ✅ GET `/study-groups` retorna HTTP 200 con array vacío `[]`<br>✅ Página muestra "No hay grupos de estudio" o similiar<br>✅ UI es clara (no parece error)<br>✅ Botón para crear grupo (si está implementado) visible |
| **Obs** | Empty state debe ser amigable; no mostrar "Error" |

- [ ] **REG-ADMIN-05**: Ejecutado y Validado ✅

---

#### **REG-ADMIN-06: Error en Fetch de Grupos (Network Error)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | ADMIN |
| **Tipo** | Edge Case |
| **Pre-req** | Simular error: DevTools → Network → throttle o Backend apagado |
| **Acción** | 1. Accede a `/admin` (sin conexión a backend) |
| **Resultado Esperado** | ✅ GET `/study-groups` falla (timeout o 500)<br>✅ Error mostrado en UI: "Error al cargar grupos"<br>✅ Botón "Reintentar" disponible<br>✅ NO hay estado residual de carga indefinido |
| **Obs** | Timeout debe ser razonable (3-5 seg max) |

- [ ] **REG-ADMIN-06**: Ejecutado y Validado ✅

---

#### **REG-ADMIN-07: Token Expirado Mientras Admin Está en Panel**

| Campo | Detalle |
|-------|---------|
| **Módulo** | ADMIN |
| **Tipo** | Edge Case |
| **Pre-req** | Admin logueado en `/admin`; token próximo a expirar |
| **Acción** | 1. Espera a que token expire<br>2. Click en botón de acción (ej. cargar grupos nuevamente) |
| **Resultado Esperado** | ✅ GET retorna 401<br>✅ Interceptor redirige a `/login`<br>✅ Limpio, sin UI rota |
| **Obs** | Igual a REG-AUTH-11 pero contexto Admin |

- [ ] **REG-ADMIN-07**: Ejecutado y Validado ✅

---

## 💬 MÓDULO: CHAT GRUPAL / MENSAJES (CHAT)

### 🟢 HAPPY PATHS

#### **REG-CHAT-01: Ver Lista de Conversaciones Activas**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado (estudiante o admin); existen conversaciones activas en BD |
| **Acción** | 1. Navega a `/mensajes`<br>2. Página carga |
| **Resultado Esperado** | ✅ GET `/conversations` (o equiv.) ejecutado<br>✅ Retorna HTTP 200 con lista de conversaciones<br>✅ Cada conversación muestra:<br>   - Avatar/nombre del grupo o usuario<br>   - Último mensaje (preview)<br>   - Timestamp del último mensaje<br>   - Contador de mensajes no leídos (si aplica)<br>✅ Conversaciones son clickeables |
| **Obs** | Verificar que datos son recientes; refresh funciona |

- [ ] **REG-CHAT-01**: Ejecutado y Validado ✅

---

#### **REG-CHAT-02: Click en Conversación para Abrir Chat**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Happy Path |
| **Pre-req** | REG-CHAT-01 completado; lista visible |
| **Acción** | 1. Hace click en una conversación de la lista |
| **Resultado Esperado** | ✅ Navega a `/chat/:conversationId`<br>✅ GET `/messages?conversationId=X` ejecutado<br>✅ Retorna HTTP 200 con array de mensajes<br>✅ Pantalla muestra:<br>   - Nombre del grupo/usuario en header<br>   - Lista de mensajes cronológica (ascendente)<br>   - Bubble de cada mensaje con: sender name, contenido, timestamp<br>   - Input box para escribir mensaje<br>   - Divisor de día entre mensajes de diferentes días |
| **Obs** | Verificar scroll position (debe estar al fondo) |

- [ ] **REG-CHAT-02**: Ejecutado y Validado ✅

---

#### **REG-CHAT-03: Enviar Mensaje de Texto en Conversación**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Happy Path |
| **Pre-req** | Chat abierto (REG-CHAT-02 completado) |
| **Acción** | 1. Escribe texto en input box<br>2. Click en botón "Enviar" o presiona Enter |
| **Resultado Esperado** | ✅ POST `/messages` con payload: `{conversationId, content}`<br>✅ Retorna HTTP 201 con mensaje creado<br>✅ Nuevo mensaje aparece en UI (optimistic update)<br>✅ Mensaje muestra:<br>   - Tu nombre (o "Tú")<br>   - Contenido del mensaje<br>   - Timestamp actual<br>   - Estado "Enviado" o checkmark<br>✅ Input box limpio; foco permanece (para siguiente mensaje)<br>✅ Chat scrollea al bottom automáticamente |
| **Obs** | Validar que timestamp es correcto (servidor time) |

- [ ] **REG-CHAT-03**: Ejecutado y Validado ✅

---

#### **REG-CHAT-04: Marcar Conversación como Leída**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Happy Path |
| **Pre-req** | Conversación con mensajes no leídos |
| **Acción** | 1. Abre `/chat/:conversationId`<br>2. Observa el contador de no leídos |
| **Resultado Esperado** | ✅ PUT o PATCH `/conversations/:id/mark-as-read` ejecutado<br>✅ Retorna HTTP 200<br>✅ Contador de no leídos en `/mensajes` desaparece o se decrementa<br>✅ Badge/indicator removido visualmente |
| **Obs** | Puede ser automático al abrir chat o manual via botón |

- [ ] **REG-CHAT-04**: Ejecutado y Validado ✅

---

#### **REG-CHAT-05: Volver a Lista de Conversaciones**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Happy Path |
| **Pre-req** | En `/chat/:conversationId` |
| **Acción** | 1. Click en botón "Atrás" o "Volver" (header o navbar)<br>2. O navega a `/mensajes` directamente |
| **Resultado Esperado** | ✅ Redirige a `/mensajes`<br>✅ Lista de conversaciones recargada<br>✅ Orden actualizado (último mensaje más reciente al top)<br>✅ Sin errores |
| **Obs** | Verificar que no se pierde scroll position |

- [ ] **REG-CHAT-05**: Ejecutado y Validado ✅

---

### 🔴 EDGE CASES

#### **REG-CHAT-06: Enviar Mensaje Vacío**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Edge Case |
| **Pre-req** | Chat abierto |
| **Acción** | 1. Deja input box vacío (solo espacios/saltos)<br>2. Intenta click "Enviar" o presiona Enter |
| **Resultado Esperado** | ✅ Validación cliente: botón "Enviar" disabled o sin efecto<br>✅ No hace POST al backend<br>✅ Error/warning visual: "Mensaje no puede estar vacío" |
| **Obs** | Frontend validation antes de POST |

- [ ] **REG-CHAT-06**: Ejecutado y Validado ✅

---

#### **REG-CHAT-07: Enviar Mensaje con Contenido Muy Largo (>5000 caracteres)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Edge Case |
| **Pre-req** | Chat abierto |
| **Acción** | 1. Copia y pega texto muy largo (>5000 chars) en input<br>2. Click "Enviar" |
| **Resultado Esperado** | ✅ O backend rechaza con HTTP 413 o 400 (payload too large)<br>✅ O frontend limita caracteres (max 5000) y no deja escribir más<br>✅ Error mostrado: "Mensaje muy largo" o similar<br>✅ Sin POST si excede límite |
| **Obs** | Verificar límite de caracteres en backend y frontend |

- [ ] **REG-CHAT-07**: Ejecutado y Validado ✅

---

#### **REG-CHAT-08: Acceder a Chat Sin Permiso (conversationId que no es tuya)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Edge Case |
| **Pre-req** | Dos usuarios: Usuario A y Usuario B en BD; conversación privada entre ellos |
| **Acción** | 1. Usuario A logueado<br>2. Obtiene `conversationId` del chat Usuario A ↔ Usuario B<br>3. Navega a `/chat/:conversationId` (su conversación privada)<br>4. Luego cierra sesión y loguea como Usuario C (sin acceso a esa conversación)<br>5. Intenta navegar a la misma URL `/chat/:conversationId` |
| **Resultado Esperado** | ✅ Backend valida permisos: GET `/messages?conversationId=X` retorna 403<br>✅ Frontend redirige a `/mensajes` o `/solicitudes`<br>✅ Error: "No tienes acceso a esta conversación"<br>✅ Conversación NO se muestra |
| **Obs** | Seguridad crítica: validar ownership en backend |

- [ ] **REG-CHAT-08**: Ejecutado y Validado ✅

---

#### **REG-CHAT-09: Conversación No Existe**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Edge Case |
| **Pre-req** | Usuario logueado |
| **Acción** | 1. Navega manualmente a `/chat/conversationid-inexistente-123` |
| **Resultado Esperado** | ✅ GET `/messages?conversationId=...` retorna 404<br>✅ Frontend muestra: "Conversación no encontrada"<br>✅ Botón "Volver a Mensajes" disponible<br>✅ Sin error genérico |
| **Obs** | Manejo de 404 amigable |

- [ ] **REG-CHAT-09**: Ejecutado y Validado ✅

---

#### **REG-CHAT-10: Enviar Mensaje sin Conexión (Offline)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Edge Case |
| **Pre-req** | Chat abierto; simular offline (DevTools → Network → Offline) |
| **Acción** | 1. Escribe mensaje<br>2. Click "Enviar" (sin internet) |
| **Resultado Esperado** | ✅ POST falla (network error)<br>✅ Error mostrado: "No hay conexión. Reintenta cuando tengas conexión"<br>✅ Mensaje se queda en input (no se pierde)<br>✅ Opción de reintentar |
| **Obs** | Posible: guardar en indexedDB y sincronizar cuando hay conexión (avanzado) |

- [ ] **REG-CHAT-10**: Ejecutado y Validado ✅

---

#### **REG-CHAT-11: Cargar Más Mensajes (Pagination/Infinite Scroll)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Edge Case |
| **Pre-req** | Conversación con 50+ mensajes; en chat |
| **Acción** | 1. Scroll al top de los mensajes (más antiguos)<br>2. Si hay paginación: click "Cargar Más"<br>3. O si hay infinite scroll: scroll sigue cargando |
| **Resultado Esperado** | ✅ GET `/messages?conversationId=X&page=2` (o limit/offset) ejecutado<br>✅ Retorna HTTP 200 con más mensajes<br>✅ Mensajes más antiguos agregados al top<br>✅ UI actualizada sin saltar scroll |
| **Obs** | Si no hay paginación en Vite: marcar como "NO IMPLEMENTADO" |

- [ ] **REG-CHAT-11**: Ejecutado y Validado ✅

---

#### **REG-CHAT-12: Chat con Mensaje Contiene Emojis/Caracteres Especiales**

| Campo | Detalle |
|-------|---------|
| **Módulo** | CHAT |
| **Tipo** | Edge Case |
| **Pre-req** | Chat abierto |
| **Acción** | 1. Escribe mensaje con emojis (ej. "Hola 👋 ¿Cómo estás? 😊")<br>2. Click "Enviar" |
| **Resultado Esperado** | ✅ POST `/messages` ejecutado sin problemas<br>✅ Mensaje aparece con emojis intactos en UI<br>✅ Emojis visible en conversación y en `/mensajes` preview<br>✅ No hay encoding issues o caracteres rotos |
| **Obs** | UTF-8 encoding en BD y frontend |

- [ ] **REG-CHAT-12**: Ejecutado y Validado ✅

---

## 📋 MÓDULO: SOLICITUDES DE ESTUDIO (SOLICITUDES)

### 🟢 HAPPY PATHS

#### **REG-SOL-01: Ver Listado de Solicitudes Disponibles**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado (estudiante); existen solicitudes en BD |
| **Acción** | 1. Navega a `/solicitudes`<br>2. Página carga |
| **Resultado Esperado** | ✅ GET `/study-requests` (o equiv.) ejecutado<br>✅ Retorna HTTP 200 con lista de solicitudes<br>✅ Cada solicitud muestra:<br>   - Nombre/descripción<br>   - Materia/asignatura<br>   - Número de miembros (si es grupal)<br>   - Estado (abierta, en progreso, cerrada)<br>   - Botones: "Ver Detalles", "Postularse" (si aplica)<br>✅ Sin errores |
| **Obs** | Verificar que listado es paginado (si hay muchas) |

- [ ] **REG-SOL-01**: Ejecutado y Validado ✅

---

#### **REG-SOL-02: Ver Detalles de una Solicitud**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Happy Path |
| **Pre-req** | REG-SOL-01 completado |
| **Acción** | 1. Click en "Ver Detalles" de una solicitud<br>2. Navega a `/solicitud/:id` |
| **Resultado Esperado** | ✅ GET `/study-requests/:id` ejecutado<br>✅ Retorna HTTP 200 con detalles completos:<br>   - Descripción completa<br>   - Asignatura<br>   - Requisitos (si hay)<br>   - Miembros actuales<br>   - Botones: "Postularse", "Compartir" (si aplica)<br>✅ Información actualizada y correcta |
| **Obs** | Verificar que datos coinciden con versión Expo |

- [ ] **REG-SOL-02**: Ejecutado y Validado ✅

---

#### **REG-SOL-03: Crear Nueva Solicitud de Estudio**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado en `/nueva-solicitud` |
| **Acción** | 1. Completa formulario:<br>   - Nombre de grupo<br>   - Asignatura<br>   - Descripción<br>   - Tipo (grupal/individual)<br>2. Click "Crear" |
| **Resultado Esperado** | ✅ POST `/study-requests` ejecutado con payload válido<br>✅ Retorna HTTP 201 con nueva solicitud creada<br>✅ Solicitud visible con ID asignado<br>✅ Usuario redirigido a `/solicitud/:id` (nueva solicitud)<br>✅ Usuario es "owner" o "creador" de la solicitud<br>✅ Toast o notificación: "Solicitud creada exitosamente" |
| **Obs** | Verificar permisos: solo estudiantes pueden crear |

- [ ] **REG-SOL-03**: Ejecutado y Validado ✅

---

#### **REG-SOL-04: Postularse a una Solicitud de Estudio**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado; en detalle de solicitud (REG-SOL-02) |
| **Acción** | 1. Click en botón "Postularse"<br>2. Confirma (si hay modal de confirmación) |
| **Resultado Esperado** | ✅ POST `/study-requests/:id/apply` ejecutado<br>✅ Retorna HTTP 201 o 200<br>✅ Usuario agregado a lista de postulantes/miembros<br>✅ Botón "Postularse" cambia a "Cancelar Postulación" (o similar)<br>✅ Contador de miembros incrementa<br>✅ Toast: "¡Te has postulado exitosamente!"<br>✅ Creador de solicitud recibe notificación |
| **Obs** | Validar que usuario no puede postularse 2 veces |

- [ ] **REG-SOL-04**: Ejecutado y Validado ✅

---

#### **REG-SOL-05: Cancelar Postulación**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario ya postulado a solicitud (REG-SOL-04 completado) |
| **Acción** | 1. Click en "Cancelar Postulación" |
| **Resultado Esperado** | ✅ DELETE `/study-requests/:id/apply` (o PATCH con status="cancelled")<br>✅ Retorna HTTP 200<br>✅ Usuario removido de miembros/postulantes<br>✅ Botón vuelve a "Postularse"<br>✅ Contador de miembros decrementa<br>✅ Toast: "Postulación cancelada" |
| **Obs** | Validar que datos se sincronizan |

- [ ] **REG-SOL-05**: Ejecutado y Validado ✅

---

#### **REG-SOL-06: Aceptar/Rechazar Postulante (Owner)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario es owner/creador de solicitud; hay postulantes; en detalle |
| **Acción** | 1. Ve lista de postulantes<br>2. Click en "Aceptar" o "Rechazar" junto a postulante |
| **Resultado Esperado** | ✅ PATCH `/study-requests/:id/postulants/:postulantId` con `{status: "accepted" o "rejected"}`<br>✅ Retorna HTTP 200<br>✅ Postulante movido a sección correspondiente (Aceptados/Rechazados)<br>✅ Postulante recibe notificación<br>✅ UI actualizada sin reload<br>✅ Si está al máximo de miembros: opción "Rechazar" solo disponible |
| **Obs** | Validar lógica de capacidad máxima |

- [ ] **REG-SOL-06**: Ejecutado y Validado ✅

---

### 🔴 EDGE CASES

#### **REG-SOL-07: Crear Solicitud sin Completar Campos Requeridos**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Edge Case |
| **Pre-req** | En `/nueva-solicitud` |
| **Acción** | 1. Deja campo "Nombre" o "Asignatura" vacío<br>2. Click "Crear" |
| **Resultado Esperado** | ✅ Validación cliente: error "Este campo es requerido"<br>✅ NO hace POST<br>✅ Campo destaca con borde rojo o error message<br>✅ Botón "Crear" disabled hasta completar |
| **Obs** | Frontend validation |

- [ ] **REG-SOL-07**: Ejecutado y Validado ✅

---
#### **REG-SOL-08: Postularse a Solicitud Ya Cerrada/Completa**

| Campo | Detalle |
| **Módulo** | SOLICITUDES |
| **Pre-req** | Solicitud con status='cerrada' o con máximo de miembros |
| **Acción** | 1. Ve detalle de solicitud<br>2. Intenta click en "Postularse" (si está enabled) |
| **Resultado Esperado** | ✅ Botón "Postularse" disabled o no visible<br>✅ Mensaje: "Esta solicitud ya no acepta postulaciones"<br>✅ Si hace POST: retorna HTTP 400 con error "Solicitud cerrada"<br>✅ No se postula |
| **Obs** | Validación en cliente y servidor |

- [ ] **REG-SOL-08**: Ejecutado y Validado ✅

---

#### **REG-SOL-09: Ver Solicitudes como Usuario Admin**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Edge Case |
| **Pre-req** | Admin logueado |
| **Acción** | 1. Navega a `/solicitudes` como admin<br>   (Si la ruta está permitida) |
| **Resultado Esperado** | ✅ Si admin puede ver: lista todas las solicitudes (no filtradas)<br>✅ Con opciones adicionales: aprobar/rechazar/eliminar<br>✅ O si admin NO puede: redirige a `/admin`<br>✅ Comportamiento debe ser consistente |
| **Obs** | Validar permisos por rol en backend |

- [ ] **REG-SOL-09**: Ejecutado y Validado ✅

---

#### **REG-SOL-10: Solicitud NO Encontrada**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Edge Case |
| **Pre-req** | Usuario logueado |
| **Acción** | 1. Navega a `/solicitud/id-inexistente-999` |
| **Resultado Esperado** | ✅ GET `/study-requests/999` retorna 404<br>✅ Página muestra: "Solicitud no encontrada"<br>✅ Botón "Volver" disponible<br>✅ Sin error genérico 404 de navegador |
| **Obs** | Manejo amigable de 404 |

- [ ] **REG-SOL-10**: Ejecutado y Validado ✅

---

#### **REG-SOL-11: Descripción de Solicitud con HTML/XSS**

| Campo | Detalle |
|-------|---------|
| **Módulo** | SOLICITUDES |
| **Tipo** | Edge Case |
| **Pre-req** | Crear solicitud con contenido malicioso |
| **Acción** | 1. En `/nueva-solicitud` o editar: intenta ingresar<br>   `<script>alert('XSS')</script>` en descripción<br>2. Submit |
| **Resultado Esperado** | ✅ Backend sanitiza/escapa HTML<br>✅ Contenido renderizado como texto (no ejecutado)<br>✅ Script NO se ejecuta<br>✅ Descripción muestra `&lt;script&gt;...&lt;/script&gt;` o similar |
| **Obs** | Seguridad contra XSS |

---
## 📍 MÓDULO: NAVEGACIÓN Y RUTAS (PARIDAD EXPO → VITE)

### 🟢 MAPEO DE RUTAS
#### **Tabla de Paridad de Rutas: Expo vs Vite**
| Funcionalidad | Ruta Expo | Ruta Vite | Estado | Notas |
|---------------|-----------|-----------|--------|-------|
| Login | `/login` | `/login` | ✅ Idéntica | |
| Home (Estudiante) | `/(tabs)` → `/feed` | `/solicitudes` (o `/mensajes`) | ⚠️ Diferente | Vite va a solicitudes como home principal |
| Home (Admin) | `/(admin)` | `/admin` | ✅ Idéntica | |
| Perfil | `/perfil` (tab) | `/perfil` | ✅ Idéntica | |
| Mensajes | `/mensajes` (tab) | `/mensajes` | ✅ Idéntica | |
| Chat | `/chat/[id]` | `/chat/:conversationId` | ✅ Equivalente | Sintaxis diferente (dynamic segments) |
| Solicitudes | Feed o tab | `/solicitudes` | ✅ Similar | Expo mostraba solicitudes en feed |
| Nueva Solicitud | `/nueva-solicitud` | `/nueva-solicitud` | ✅ Idéntica | |
| Detalle Solicitud | `/solicitud/[id]` | `/solicitud/:id` | ✅ Equivalente | Sintaxis diferente |
| Invitaciones | `/invitaciones` (tab) | `/invitaciones` | ✅ Idéntica | |
| Eventos | `/eventos` (tab) | `/eventos` | ✅ Idéntica | |
| Recursos | `/recursos` (tab) | `/recursos` | ✅ Idéntica | |
| Perfil de Otro Usuario | `/perfil-estudiante/[id]` | ❌ NO ENCONTRADA | ❌ MISSING | Verificar si está implementada |
| OAuth Callback | `/oauth-callback` | `/oauth-callback` | ✅ Idéntica | |
| Onboarding | `/onboarding` | ❌ NO ENCONTRADA | ❌ MISSING | No existe en Vite |
| Crear/Editar Evento | `/crear-evento`, `/editar-evento/[id]` | ❌ NO ENCONTRADA | ⚠️ MISSING | Funcionalidad puede estar en modal |

---

### 🔴 CASOS DE NAVEGACIÓN

#### **REG-NAV-01: Redireccionamiento Automático por Rol (Home)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | NAVEGACIÓN |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado; en raíz `/` |
| **Acción** | 1. Navega a `http://localhost:5173/`<br>2. Observa redirección |
| **Resultado Esperado** | ✅ Si rol='estudiante': redirige a `/solicitudes`<br>✅ Si rol='admin': redirige a `/admin`<br>✅ Redireccionamiento automático (sin click)<br>✅ URL actualizada sin error |
| **Obs** | Verifica que lógica de redirección coincide con Expo |

---
#### **REG-NAV-02: Botón Atrás del Navegador Funcional**

| Campo | Detalle |
| **Módulo** | NAVEGACIÓN |
| **Pre-req** | Usuario navegando entre 2+ páginas |
| **Acción** | 1. Ve desde `/solicitudes` → `/solicitud/123` (click en solicitud)<br>2. Click en botón "Atrás" del navegador (← del browser) |
| **Resultado Esperado** | ✅ Navega a `/solicitudes`<br>✅ Lista mantiene scroll position (si implementado)<br>✅ Sin errores de estado |
| **Obs** | React Router debe manejar history correctamente |

---
#### **REG-NAV-03: Navbar/Sidebar Visible en Todas las Rutas Protegidas**

| Campo | Detalle |
| **Módulo** | NAVEGACIÓN |
| **Pre-req** | Usuario logueado; navegando entre varias rutas |
| **Acción** | 1. Visita `/solicitudes`<br>2. Visita `/mensajes`<br>3. Visita `/chat/123`<br>4. Visita `/admin` (si es admin) |
| **Resultado Esperado** | ✅ Navbar/Sidebar visible en TODAS<br>✅ Contiene links a todas las secciones principales<br>✅ Link actual highlighted (activo)<br>✅ Botón logout disponible<br>✅ Nombre del usuario visible |
| **Obs** | UI consistente entre páginas |

---
#### **REG-NAV-04: Links Internos Funcionan (Sin Recargas)**

| Campo | Detalle |
| **Módulo** | NAVEGACIÓN |
| **Pre-req** | Usuario logueado |
| **Acción** | 1. Click en link "Solicitudes" del navbar<br>2. Observa navegación |
| **Resultado Esperado** | ✅ Navega a `/solicitudes` sin recargar página (SPA behavior)<br>✅ URL actualizada<br>✅ Contenido cambia sin flash/parpadeo<br>✅ No hay reload de JS bundle |
| **Obs** | React Router debe hacer navegación del lado cliente |

---
#### **REG-NAV-05: Ruta No Existente (404)**

| Campo | Detalle |
| **Módulo** | NAVEGACIÓN |
| **Pre-req** | Usuario logueado |
| **Acción** | 1. Navega manualmente a `/ruta-que-no-existe` |
| **Resultado Esperado** | ✅ Se muestra página de "404 Not Found" o <NotFoundPage><br>✅ Botón "Volver al Inicio" disponible<br>✅ No hay error en console<br>✅ Navbar sigue visible |
| **Obs** | Verificar que wildcard route `*` redirige a 404 |

---
#### **REG-NAV-06: Rutas Dinámicas con Parámetros Inválidos**

| Campo | Detalle |
| **Módulo** | NAVEGACIÓN |
| **Pre-req** | Usuario logueado |
| **Acción** | 1. Navega a `/chat/conversationId-que-no-existe-xyz` |
| **Resultado Esperado** | ✅ Fetch de datos intenta GET `/messages?conversationId=xyz`<br>✅ Backend retorna 404<br>✅ Frontend muestra error amigable: "Conversación no encontrada"<br>✅ NO error 500 o blank page |
| **Obs** | Validación de parámetro debe hacerse en server |

---
#### **REG-NAV-07: Navegar Sin Perder Estado (Ejemplo: Form Incompleto)**

| Campo | Detalle |
| **Módulo** | NAVEGACIÓN |
| **Pre-req** | Usuario en `/nueva-solicitud` con formulario parcialmente llenado |
| **Acción** | 1. Llena campos del formulario pero no submit<br>2. Click en "Solicitudes" del navbar<br>3. Vuelve a `/nueva-solicitud` (click en navbar o botón) |
| **Resultado Esperado** | ✅ Opción A: Formulario se limpió (reset)<br>✅ Opción B: Datos se guardaron en localStorage/store (avanzado)<br>✅ Comportamiento consistente y explícito<br>✅ Sin datos residuales confusos |
| **Obs** | Validar UX expectation; ambas opciones son válidas si es clara |

---
## 🎯 MÓDULO: EVENTOS (EVENTOS)

### 🟢 HAPPY PATHS
#### **REG-EVT-01: Ver Listado de Eventos**
| Campo | Detalle |
|-------|---------|
| **Módulo** | EVENTOS |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado; existen eventos en BD |
| **Acción** | 1. Navega a `/eventos` |
| **Resultado Esperado** | ✅ GET `/events` ejecutado<br>✅ Retorna HTTP 200 con lista de eventos<br>✅ Cada evento muestra: nombre, fecha, hora, ubicación, descripción<br>✅ Eventos están ordenados por fecha (próximos primero)<br>✅ Botón "Ver Detalles" disponible |
| **Obs** | Verificar que datos son actuales |

---
#### **REG-EVT-02: Crear Nuevo Evento**

| Campo | Detalle |
| **Módulo** | EVENTOS |
| **Pre-req** | Usuario logueado (estudiante o admin) |
| **Acción** | 1. Click en "Crear Evento"<br>2. Completa formulario: nombre, fecha, hora, ubicación, descripción<br>3. Click "Guardar" |
| **Resultado Esperado** | ✅ POST `/events` ejecutado<br>✅ Retorna HTTP 201<br>✅ Evento visible en lista<br>✅ Usuario es creador del evento<br>✅ Toast: "Evento creado exitosamente" |
| **Obs** | Validar que date picker funciona correctamente |

---
### 🔴 EDGE CASES

#### **REG-EVT-03: Evento Sin Detalles Requeridos**
| Campo | Detalle |
| **Módulo** | EVENTOS |
| **Tipo** | Edge Case |
| **Pre-req** | En formulario crear evento |
| **Acción** | 1. Deja campo "Fecha" vacío<br>2. Click "Guardar" |
| **Resultado Esperado** | ✅ Validación cliente: error "Fecha es requerida"<br>✅ NO hace POST<br>✅ Campo destaca |
| **Obs** | Frontend validation |

---

## 🏫 MÓDULO: RECURSOS (RECURSOS)

### 🟢 HAPPY PATHS

#### **REG-RES-01: Ver Listado de Recursos Compartidos**

| Campo | Detalle |
|-------|---------|
| **Módulo** | RECURSOS |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado; existen recursos en BD |
| **Acción** | 1. Navega a `/recursos` |
| **Resultado Esperado** | ✅ GET `/resources` ejecutado<br>✅ Retorna HTTP 200 con lista de recursos<br>✅ Cada recurso muestra: título, descripción, tipo (PDF/video/etc), autor, fecha<br>✅ Botón "Descargar" o "Ver" disponible |
| **Obs** | Verificar que documentos se abren/descargan correctamente |

---
#### **REG-RES-02: Compartir Nuevo Recurso**

| Campo | Detalle |
| **Módulo** | RECURSOS |
| **Pre-req** | Usuario logueado; navegando en `/recursos` |
| **Acción** | 1. Click "Compartir Recurso"<br>2. Carga archivo o ingresa URL<br>3. Ingresa descripción<br>4. Click "Compartir" |
| **Resultado Esperado** | ✅ POST `/resources` ejecutado<br>✅ Archivo uploadado (si aplica)<br>✅ Retorna HTTP 201<br>✅ Nuevo recurso visible en lista<br>✅ Toast: "Recurso compartido exitosamente" |
| **Obs** | Validar manejo de file uploads |

---
### 🔴 EDGE CASES

#### **REG-RES-03: Compartir Archivo Muy Grande (>50MB)**
| Campo | Detalle |
| **Módulo** | RECURSOS |
| **Tipo** | Edge Case |
| **Pre-req** | Formulario de compartir recurso |
| **Acción** | 1. Intenta cargar archivo > 50MB<br>2. Click "Compartir" |
| **Resultado Esperado** | ✅ Validación cliente: error "Archivo muy grande (máx 50MB)"<br>✅ NO intenta upload<br>✅ O POST falla con HTTP 413 (Payload Too Large) |
| **Obs** | Validar límite de tamaño |

---
## 👤 MÓDULO: PERFIL (PERFIL)

### 🟢 HAPPY PATHS
#### **REG-PRF-01: Ver Mi Perfil**
| Campo | Detalle |
|-------|---------|
| **Módulo** | PERFIL |
| **Tipo** | Happy Path |
| **Pre-req** | Usuario logueado |
| **Acción** | 1. Navega a `/perfil` |
| **Resultado Esperado** | ✅ GET `/profile` (o GET `/users/:id`) ejecutado<br>✅ Retorna HTTP 200 con datos del usuario:<br>   - Nombre completo<br>   - Email<br>   - Número de teléfono (si ingresó)<br>   - Programa/Facultad<br>   - Bio<br>   - Avatar<br>✅ Página muestra todos los datos<br>✅ Botón "Editar" disponible |
| **Obs** | Verificar que datos son actuales |

---

#### **REG-PRF-02: Editar Perfil**

| Campo | Detalle |
|-------|---------|
| **Módulo** | PERFIL |
| **Tipo** | Happy Path |
| **Pre-req** | En `/perfil` |
| **Acción** | 1. Click "Editar"<br>2. Modifica un campo (ej. Bio)<br>3. Click "Guardar" |
| **Resultado Esperado** | ✅ PATCH `/profile` ejecutado<br>✅ Retorna HTTP 200<br>✅ Datos actualizados en UI<br>✅ Toast: "Perfil actualizado"<br>✅ Avatar/nombre actualizado en navbar (si cambió) |
| **Obs** | Validar que cambios persisten |

---

### 🔴 EDGE CASES

#### **REG-PRF-03: Cambiar Avatar (Upload Image)**

| Campo | Detalle |
|-------|---------|
| **Módulo** | PERFIL |
| **Tipo** | Edge Case |
| **Pre-req** | En formulario editar perfil |
| **Acción** | 1. Click en avatar para seleccionar imagen<br>2. Selecciona archivo PNG/JPG<br>3. Click "Guardar" |
| **Resultado Esperado** | ✅ Imagen uploadada a storage<br>✅ PATCH `/profile` con URL de imagen<br>✅ Avatar actualizado en UI y navbar<br>✅ Imagen muestra correctamente sin compresión extrema<br>✅ Si archivo > 5MB: error "Imagen muy grande" |
| **Obs** | Validar calidad de imagen después de upload |

---
## 📊 RESUMEN DE COBERTURA: MATRIZ COMPLETA

### Estadísticas de Casos de Prueba
| Módulo | Happy Paths | Edge Cases | Total | % Cobertura |
| **AUTH** | 6 | 9 | 15 | Crítica |
| **ADMIN** | 4 | 3 | 7 | Alta |
| **CHAT** | 5 | 7 | 12 | Alta |
| **SOLICITUDES** | 6 | 5 | 11 | Alta |
| **NAVEGACIÓN** | 4 | 3 | 7 | Alta |
| **EVENTOS** | 2 | 1 | 3 | Media |
| **RECURSOS** | 2 | 1 | 3 | Media |
| **PERFIL** | 2 | 1 | 3 | Media |
| **INVITACIONES** | — | — | 0 | Pendiente |
| **TOTAL** | **31** | **30** | **61** | Exhaustiva |

---

## ✅ CHECKLIST PARA EL QA LEAD

### Fase 1: Setup y Validación Inicial

- [x] **Pre-req-01**: Backend (gateway + auth + study-groups services) corriendo sin errores
- [x] **Pre-req-02**: Frontend (Vite) compilado y sirviendo en `http://localhost:5173`
- [x] **Pre-req-03**: BD PostgreSQL con datos de prueba (usuarios, grupos, solicitudes, mensajes)
- [x] **Pre-req-04**: Variables de entorno configuradas (VITE_API_URL apuntando a backend)
- [x] **Pre-req-05**: DevTools abierto (F12) en pestaña "Network" y "Console" para monitorear requests

### Fase 2: Ejecución de Casos

- [ ] **Bloque AUTH**: Ejecutar REG-AUTH-01 → REG-AUTH-15 (todas pasan)
- [ ] **Bloque ADMIN**: Ejecutar REG-ADMIN-01 → REG-ADMIN-07 (todas pasan)
- [ ] **Bloque CHAT**: Ejecutar REG-CHAT-01 → REG-CHAT-12 (todas pasan)
- [ ] **Bloque SOLICITUDES**: Ejecutar REG-SOL-01 → REG-SOL-11 (todas pasan)
- [ ] **Bloque NAVEGACIÓN**: Ejecutar REG-NAV-01 → REG-NAV-07 (todas pasan)
- [ ] **Bloque EVENTOS**: Ejecutar REG-EVT-01 → REG-EVT-03 (si funcionalidad existe)
- [ ] **Bloque RECURSOS**: Ejecutar REG-RES-01 → REG-RES-03 (si funcionalidad existe)
- [ ] **Bloque PERFIL**: Ejecutar REG-PRF-01 → REG-PRF-03 (todas pasan)

### Fase 3: Validación de Paridad

- [ ] **Ruta Paridad**: Todas las rutas de Expo mapeadas en Vite (excepto rutas faltantes documentadas)
- [ ] **Funcionalidad**: Flujos en Vite funcionan idéntico a Expo
- [ ] **UI/UX**: Experiencia es coherente con legacy (validar estilos, layout, responsive)
- [ ] **Permisos**: Roles (estudiante vs admin) son respetados

### Fase 4: Validación Técnica

- [ ] **No Errores Console**: 0 errores JavaScript en DevTools
- [ ] **Requests HTTP**: Todos los GET/POST/PATCH/DELETE retornan status code esperado
- [ ] **Auth Token**: `localStorage.accessToken` se comporta correctamente (guardar/limpiar)
- [ ] **Interceptors**: 401 trigger redirección a login correctamente
- [ ] **Validaciones**: Frontend valida antes de POST (campos requeridos, formato, etc)
- [ ] **Load Times**: Páginas cargan en < 3 segundos (primero) y < 1 segundo (navegación interna)

### Fase 5: Resumen Final

- [ ] **Total Casos Ejecutados**: _____ / 61
- [ ] **Casos Pasados**: _____ (✅)
- [ ] **Casos Fallidos**: _____ (❌)
- [ ] **Casos No Aplicable/Diferido**: _____ (⏸️)
- [ ] **Bloqueadores Críticos**: _____ (requieren fix inmediato)
- [ ] **Funcionalidades Faltantes**: Listar las rutas/features en Expo que NO están en Vite

---

## 🚨 BUGS CONOCIDOS (REPORTADOS PREVIAMENTE)

Basado en comentarios iniciales:
- [ ] **BUG-01**: Errors 500 en API — Investigar logs del backend (auth service, gateway)
- [ ] **BUG-02**: Rutas rotas en frontend — Verificar que todas las rutas en App.tsx están correctas
- [ ] **BUG-03**: 401 al iniciar sesión como admin — Revisar endpoint `/auth/signin` y validación de rol en backend

**Recomendación**: Ejecutar REG-AUTH-02 primero para diagnosticar BUG-03.

---

## 📝 PRÓXIMOS PASOS (POST MANUAL QA)

1. **Reportar hallazgos** en formato: ID caso → ✅/❌ → descripción de fallo (si aplica)
2. **Crear tickets** en Jira/GitHub para cada fallo identificado
3. **Priorizar fixes** (crítico → bloqueador de Sprint)
4. **Re-ejecutar casos** después de fixes (regresión local)
5. **Aprobación final** por Tech Lead antes de pasar a automatización

---

**Status**: Matriz lista para ejecución manual  
**Última actualización**: 8 de mayo de 2026  
**Próximo checkpoint**: Reporte de ejecución con score de % casos pasados
