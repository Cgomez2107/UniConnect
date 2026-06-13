# US-EV07 — Código QR como Pase de Acceso — Diseño de Arquitectura

## 1. Resumen

Generar un código QR único (firmado con HMAC-SHA256) por cada registro a un evento.  
El estudiante lo visualiza desde "Mis Eventos" (web + mobile).  
El organizador lo escanea desde la app mobile y verifica contra el backend en tiempo real.

---

## 2. Flujo de Datos

```
[Registro exitoso]
     │
     v
[Backend] genera: registrationId + HMAC-SHA256(registrationId + secret)
     │
     v
[QR] contenido = "uniconnect://access?rid=<uuid>&sig=<hex>"
     │
     ├── [Web/Mobile Estudiante] → renderiza QR, descarga PNG
     │
     └── [Mobile Organizador]
              │ escanea QR
              v
         POST /api/v1/registrations/verify
              │
              v
         [Backend] valida HMAC, checks is_used, status
              │
              ├── Válido   → { valid: true,  user: {...}, scannedAt: null }
              ├── Usado    → { valid: false, reason: "Ya verificado", scannedAt: "..." }
              └── Inválido → { valid: false, reason: "..." }
```

---

## 3. Capa de Datos — Migración SQL

Se modifica la tabla `event_registrations` (migración `20260610_us_ev07_qr_access.sql`):

```sql
ALTER TABLE event_registrations
  ADD COLUMN id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN qr_token        UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN qr_hmac         TEXT,
  ADD COLUMN scanned_at      TIMESTAMPTZ,
  ADD COLUMN scanned_by      UUID REFERENCES profiles(id),
  ADD COLUMN is_used         BOOLEAN NOT NULL DEFAULT false;
```

- `id` — nuevo PK UUID (permite referenciar un registro individual)
- `qr_token` — UUID único, identificador público del pase
- `qr_hmac` — HMAC-SHA256 del `qr_token` (cache para no recalcular cada vez que se pide el QR)
- `scanned_at` / `scanned_by` / `is_used` — auditoría de acceso

---

## 4. Capa de Backend — Events Service

### 4.1 Nueva variable de entorno

`backend/services/events/.env`:
```
QR_HMAC_SECRET=dev_qr_hmac_secret_change_in_prod
```

Agregar al schema `EventsEnv` en `config/env.ts`.

### 4.2 Nuevo Value Object — `QrPass`

```typescript
// backend/services/events/src/domain/value-objects/QrPass.ts
class QrPass {
  constructor(
    public readonly registrationId: string,
    public readonly token: string,       // qr_token UUID
    public readonly signature: string,   // HMAC-SHA256 hex
  ) {}

  get qrContent(): string {
    return `uniconnect://access?rid=${this.token}&sig=${this.signature}`;
  }

  static sign(token: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(token).digest("hex");
  }

  static verify(token: string, signature: string, secret: string): boolean {
    const expected = QrPass.sign(token, secret);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}
```

### 4.3 Nuevo Use Case — `GenerateQrPass`

**Disparador**: llamado desde `RegisterForEvent.execute()` **después** de insertar el registro en DB.

```typescript
// backend/services/events/src/application/use-cases/GenerateQrPass.ts
class GenerateQrPass {
  constructor(
    private repo: IEventRepository,
    private qrSecret: string,
  ) {}

  async execute(eventId: string, userId: string): Promise<QrPass> {
    // 1. Obtener el registration (event_id, user_id) de la DB
    const registration = await this.repo.getRegistration(eventId, userId);
    // 2. Usar registration.id como token público
    //    O generar un qr_token separado (más seguro)
    const token = registration.qr_token ?? registration.id;
    const signature = QrPass.sign(token, this.qrSecret);
    // 3. Persistir qr_token y qr_hmac en la fila
    await this.repo.setQrData(registration.id, token, signature);
    return new QrPass(registration.id, token, signature);
  }
}
```

**Modificación**: En `RegisterForEvent.execute()`, después de `repository.registerForEvent(eventId, userId)` (línea 30), agregar:

```typescript
await this.generateQrPass.execute(eventId, userId);
```

### 4.4 Nuevo Use Case — `VerifyQrPass`

```typescript
// backend/services/events/src/application/use-cases/VerifyQrPass.ts
class VerifyQrPass {
  execute(qrContent: string): Promise<VerificationResult>
}
```

**Lógica**:
1. Parsear `qrContent` → extraer `token` + `signature`
2. Validar estructura del QR (`uniconnect://access?rid=...&sig=...`)
3. Verificar HMAC con `QrPass.verify(token, signature, qrSecret)`
4. Buscar `event_registrations` por `qr_token = token`
5. Validar estados:
   - Si `is_used = true` → `{ valid: false, reason: "Ya verificado", scannedAt }`
   - Si el evento está `cancelled` → `{ valid: false, reason: "Evento cancelado" }`
   - Si el registro fue cancelado → `{ valid: false, reason: "Inscripción cancelada" }`
   - Si la firma no coincide → `{ valid: false, reason: "Firma digital corrupta" }`
   - Si todo OK → `{ valid: true, user: { fullName, avatarUrl }, scannedAt: null }`
6. Si es válido → marcar como usado (`is_used = true`, `scanned_at = now()`, `scanned_by = organizerId`)

### 4.5 Nuevo Endpoint — `POST /api/v1/registration/verify`

**Ruta** en `eventsRoutes.ts`:

```typescript
router.post("/api/v1/registration/verify", actorMiddleware, controller.verifyQr);
```

**Controller**:

```typescript
async verifyQr(req: Request, res: Response) {
  const { qrData } = req.body;
  const organizerId = req.actorUserId;
  const result = await this.verifyQrPass.execute(qrData, organizerId);
  sendData(res, 200, result);
}
```

**Request**:
```json
{ "qrData": "uniconnect://access?rid=abc-123&sig=deadbeef..." }
```

**Response — Válido**:
```json
{
  "data": {
    "valid": true,
    "user": { "fullName": "Juan Pérez", "avatarUrl": "https://..." },
    "scannedAt": null
  }
}
```

**Response — Ya usado**:
```json
{
  "data": {
    "valid": false,
    "reason": "Ya verificado",
    "scannedAt": "2026-06-11T10:30:00Z"
  }
}
```

**Response — Inválido**:
```json
{
  "data": {
    "valid": false,
    "reason": "Evento cancelado"
  }
}
```

### 4.6 Nuevo método en `IEventRepository`

```typescript
interface IEventRepository {
  // existentes...
  getRegistration(eventId: string, userId: string): Promise<EventRegistration | null>;
  getRegistrationByQrToken(token: string): Promise<EventRegistration | null>;
  setQrData(registrationId: string, qrToken: string, qrHmac: string): Promise<void>;
  markQrAsUsed(registrationId: string, scannedBy: string): Promise<void>;
}
```

**`EventRegistration`** nueva entidad/interface:

```typescript
interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  qrToken: string | null;
  qrHmac: string | null;
  scannedAt: string | null;
  scannedBy: string | null;
  isUsed: boolean;
  createdAt: string;
}
```

---

## 5. Capa de Web Frontend — Estudiante (Visualización QR)

### 5.1 Dependencia nueva

```json
// web/package.json
"qrcode.react": "^4.2.0"
```

### 5.2 Componente — `QrPassModal`

```
web/src/components/shared/QrPassModal.tsx
```

**Props**:
- `isOpen: boolean`
- `onClose: () => void`
- `qrContent: string`
- `eventTitle: string`

**Features**:
- Modal con overlay (reutilizar `Modal` de `web/src/components/ui/Modal.tsx`)
- Renderiza QR con `qrcode.react` → `<QRCode value={qrContent} size={256} />`
- Botón "Descargar PNG" → usa `canvas.toDataURL()` + `<a download>`
- Zoom: contenedor con `overflow: auto` y `transform: scale()` vía CSS o wheel event
- Texto: "Pase de acceso para: {eventTitle}"

### 5.3 Modificación — `EventCard.tsx` / `EventosPage.tsx` ("Mis Eventos")

En la sección "Mis Eventos" de `EventosPage.tsx`:
- Cada `EventCard` (o los cards de eventos registrados) debe mostrar un botón **"+ Pase de Acceso"**
- Al hacer clic, abre `QrPassModal` con el `qrContent`

**¿Cómo obtener el `qrContent`?**  
Opción A: Nuevo endpoint `GET /api/v1/events/:id/my-pass` que devuelve `{ qrContent }`  
Opción B: Incluir `qrContent` en la respuesta de `GET /api/v1/events/:id` cuando `isRegistered = true`  
Opción C: Nuevo endpoint `GET /api/v1/registrations/my-passes` que lista todos los pases del usuario

**Recomendación**: Opción C (más limpia, separa concerns). Endpoint nuevo en `EventsClient.listMyPasses()` y `eventsService.listMyPasses()`.

### 5.4 Nueva ruta en `EventsClient`

```typescript
// packages/shared-api/src/clients/EventsClient.ts
async listMyPasses(): Promise<{ eventId: string; eventTitle: string; qrContent: string }[]>
async getMyPass(eventId: string): Promise<{ qrContent: string }>
```

### 5.5 Nuevo método en `events.service.ts`

```typescript
// web/src/lib/services/events.service.ts
async getEventPass(eventId: string): Promise<{ qrContent: string }>
```

---

## 6. Capa de Mobile Frontend — Estudiante (Visualización QR)

### 6.1 Dependencias nuevas

```json
// frontend/package.json
"react-native-qrcode-svg": "^6.3.14"
"expo-file-system": "~18.0.0"     // para guardar PNG
"expo-sharing": "~13.0.0"         // para compartir/guardar
```

### 6.2 Componente — `QrPassSheet`

```
frontend/components/events/QrPassSheet.tsx
```

**Features**:
- Bottom sheet / modal usando `react-native` `Modal` + `PanResponder` o librería existente
- Renderiza QR con `react-native-qrcode-svg` → `<QRCode value={qrContent} size={250} />`
- Botón "Guardar imagen" → captura el SVG como PNG via `expo-file-system` + `expo-sharing`
- Zoom: envolver en `ScrollView` con `maximumZoomScale` o `PinchGestureHandler`
- Texto: "Pase de acceso para: {eventTitle}"

### 6.3 Modificación — `eventos.tsx` ("Mis Eventos")

Agregar botón "+ Pase de Acceso" en cada card de `myEvents` que abre `QrPassSheet`.

**¿Cómo obtener `qrContent`?**  
Similar a web: nuevo método `getEventPass(eventId)` en `IEventRepository` + `ApiEventRepository`.

### 6.4 Nuevo método en `IEventRepository`

```typescript
interface IEventRepository {
  getEventPass(eventId: string): Promise<{ qrContent: string }>;
}
```

Implementar en `ApiEventRepository` → `GET /api/v1/events/:id/my-pass`.

---

## 7. Capa de Mobile Frontend — Organizador (Escáner QR)

### 7.1 Dependencias nuevas

```json
// frontend/package.json
"expo-camera": "~18.0.0"
```

### 7.2 Nueva Screen — `frontend/app/eventos/escanear.tsx`

**Protección**: Solo usuarios con `role === "admin"` pueden acceder.

**Layout**:
```
┌──────────────────────┐
│  CameraView (full)   │
│  ┌────────────────┐  │
│  │  QR scanner    │  │
│  │  (viewfinder)  │  │
│  └────────────────┘  │
│                      │
│  [Cerrar escáner]    │
└──────────────────────┘
```

**Flujo**:
1. Abrir `CameraView` con `barcodeScannerEnabled={true}`
2. Escanear código QR → extraer `qrData` string
3. Pausar la cámara
4. Mostrar tarjeta flotante de resultado:
   - **Válido (verde)**: `"Acceso Válido"`, nombre + foto del estudiante, botón "Continuar escaneando"
   - **Ya usado (amarillo)**: `"Ya verificado"`, timestamp, botón "Continuar escaneando"
   - **Inválido (rojo)**: `"No válido"`, razón específica, botón "Continuar escaneando"
5. Al presionar "Continuar escaneando" → reanudar cámara

### 7.3 Manejo de escaneo

```typescript
const handleBarCodeScanned = async ({ data }: { data: string }) => {
  setScanning(false); // pausa cámara
  try {
    const response = await fetch(`${API_URL}/api/v1/registration/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ qrData: data }),
    });
    const result = await response.json();
    showResult(result.data); // verde/amarillo/rojo
  } catch {
    showResult({ valid: false, reason: "Error de conexión" }); // rojo
  }
};
```

### 7.4 Ruta protegida

En el layout del organizador (`frontend/app/(admin)/_layout.tsx` o en el router) agregar:

```typescript
<Stack.Screen name="eventos/escanear" options={{ title: "Escanear QR" }} />
```

---

## 8. Seguridad

| Aspecto | Mecanismo |
|---------|-----------|
| Firma QR | HMAC-SHA256 con `QR_HMAC_SECRET` por entorno |
| Anti-tampering | `crypto.timingSafeEqual` en verify |
| Anti-replay | `is_used` flag + `scanned_at` timestamp |
| Expirados | Validar que `event_date` no haya pasado |
| Cancelados | Validar status del evento y del registro |
| Acceso escáner | Solo `role === "admin"` puede abrir la ruta |
| Transporte | HTTPS (asumido en producción) |

---

## 9. Resumen de Cambios por Capa

| Capa | Archivos Nuevos | Archivos Modificados |
|------|----------------|----------------------|
| **DB** | — | Migración SQL nueva en `backend/supabase/migrations/` |
| **Backend VO** | `QrPass.ts` | — |
| **Backend UC** | `GenerateQrPass.ts`, `VerifyQrPass.ts` | `RegisterForEvent.ts` (inyectar `GenerateQrPass`) |
| **Backend Repo** | — | `IEventRepository.ts`, `PostgresEventRepository.ts` |
| **Backend Route** | — | `eventsRoutes.ts` |
| **Backend Controller** | — | `EventsController.ts` (+ método `verifyQr`) |
| **Backend Env** | — | `config/env.ts`, `.env`, `.env.example` |
| **Shared API** | — | `EventsClient.ts` (+ `getMyPass`, `listMyPasses`) |
| **Web** | `QrPassModal.tsx` | `EventosPage.tsx`, `events.service.ts`, `package.json` |
| **Mobile** | `QrPassSheet.tsx`, `escanear.tsx` | `eventos.tsx`, `IEventRepository.ts`, `ApiEventRepository.ts`, `package.json` |
