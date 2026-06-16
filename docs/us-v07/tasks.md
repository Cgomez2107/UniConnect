# US-EV07 — Código QR como Pase de Acceso

## Tareas Técnicas

### Fase 1: Base de Datos y Backend (Infraestructura)

- [ ] **US-EV07-01** — Migración: agregar columnas QR a `event_registrations`
      Archivo: `backend/supabase/migrations/20260610_us_ev07_qr_access.sql`
      Add: `id UUID PK`, `qr_token UUID UNIQUE`, `qr_hmac TEXT`, `scanned_at TIMESTAMPTZ`, `scanned_by UUID`, `is_used BOOLEAN DEFAULT false`

- [ ] **US-EV07-02** — Agregar `QR_HMAC_SECRET` a la configuración del Events Service
      Archivos: `backend/services/events/.env`, `backend/services/events/.env.example`, `backend/services/events/src/config/env.ts`

- [ ] **US-EV07-03** — Crear Value Object `QrPass` en dominio
      Archivo: `backend/services/events/src/domain/value-objects/QrPass.ts`
      Métodos: `sign(token, secret)`, `verify(token, signature, secret)`, getter `qrContent`

- [ ] **US-EV07-04** — Extender `IEventRepository` con métodos QR
      Archivo: `backend/services/events/src/domain/repositories/IEventRepository.ts`
      Add: `getRegistration`, `getRegistrationByQrToken`, `setQrData`, `markQrAsUsed`

- [ ] **US-EV07-05** — Implementar métodos QR en `PostgresEventRepository`
      Archivo: `backend/services/events/src/infrastructure/database/PostgresEventRepository.ts`
      Queries: INSERT/UPDATE en `event_registrations` con las nuevas columnas

- [ ] **US-EV07-06** — Crear `GenerateQrPass` use case
      Archivo: `backend/services/events/src/application/use-cases/GenerateQrPass.ts`
      Lógica: firmar `qr_token` con HMAC, persistir en DB

- [ ] **US-EV07-07** — Modificar `RegisterForEvent` para inyectar y llamar `GenerateQrPass`
      Archivo: `backend/services/events/src/application/use-cases/RegisterForEvent.ts`
      Disparar `generateQrPass.execute(eventId, userId)` después de `registerForEvent`

- [ ] **US-EV07-08** — Crear `VerifyQrPass` use case
      Archivo: `backend/services/events/src/application/use-cases/VerifyQrPass.ts`
      Lógica: parsear QR, verificar HMAC, checkear `is_used` y estados, marcar como usado si válido

- [ ] **US-EV07-09** — Agregar endpoint `POST /api/v1/registration/verify`
      Archivos: `eventsRoutes.ts`, `EventsController.ts` (+ método `verifyQr`)
      Request: `{ qrData }` → Response: `{ valid, user?, reason?, scannedAt? }`

- [ ] **US-EV07-10** — Agregar endpoint `GET /api/v1/events/:id/my-pass` (para obtener QR content)
      Archivos: `eventsRoutes.ts`, `EventsController.ts` (+ método `getMyPass`)
      Modificar `EventsClient.ts` en shared-api con `getMyPass(eventId)`

### Fase 2: Web Frontend — Visualización QR (Estudiante)

- [ ] **US-EV07-11** — Instalar `qrcode.react` en web
      Comando: `cd web && pnpm add qrcode.react`

- [ ] **US-EV07-12** — Agregar método `getEventPass` a `events.service.ts`
      Archivo: `web/src/lib/services/events.service.ts`

- [ ] **US-EV07-13** — Crear componente `QrPassModal`
      Archivo: `web/src/components/shared/QrPassModal.tsx`
      Features: modal, QR rendering, descarga PNG, zoom

- [ ] **US-EV07-14** — Agregar botón "+ Pase de Acceso" en "Mis Eventos" y conectar modal
      Archivo: `web/src/pages/EventosPage.tsx`
      Condición: solo para eventos donde `isRegistered === true` o usando `listMyPasses`

- [ ] **US-EV07-15** — Verificar type-check web
      Comando: `cd web && pnpm tsc --noEmit`

### Fase 3: Mobile Frontend — Visualización QR (Estudiante)

- [ ] **US-EV07-16** — Instalar `react-native-qrcode-svg` en mobile
      Comando: `cd frontend && pnpm add react-native-qrcode-svg`

- [ ] **US-EV07-17** — Agregar método `getEventPass` al repositorio mobile
      Archivos: `IEventRepository.ts`, `ApiEventRepository.ts` (llama a `GET /api/v1/events/:id/my-pass`)

- [ ] **US-EV07-18** — Crear componente `QrPassSheet`
      Archivo: `frontend/components/events/QrPassSheet.tsx`
      Features: bottom sheet/modal, QR rendering con `react-native-qrcode-svg`, guardar PNG, zoom

- [ ] **US-EV07-19** — Agregar botón "+ Pase de Acceso" en Mis Eventos mobile
      Archivo: `frontend/app/(tabs)/eventos.tsx`
      En el `renderMyEventItem` o dentro del FlatList de mis eventos

- [ ] **US-EV07-20** — Verificar type-check mobile
      Comando: `cd frontend && pnpm tsc --noEmit`

### Fase 4: Mobile Frontend — Escáner QR (Organizador)

- [ ] **US-EV07-21** — Instalar `expo-camera` en mobile
      Comando: `cd frontend && pnpm add expo-camera`

- [ ] **US-EV07-22** — Crear screen `eventos/escanear.tsx`
      Archivo: `frontend/app/eventos/escanear.tsx`
      Features: cámara fullscreen, viewfinder QR, protección admin-only

- [ ] **US-EV07-23** — Implementar lógica de escaneo + verificación
      Archivo: `frontend/app/eventos/escanear.tsx` (continuación)
      Pausar cámara al escanear → POST a `/api/v1/registration/verify` → mostrar resultado

- [ ] **US-EV07-24** — Crear componente `ScanResultCard`
      Archivo: `frontend/components/events/ScanResultCard.tsx`
      Tres variantes: verde (válido), amarillo (ya usado), rojo (inválido)

- [ ] **US-EV07-25** — Agregar ruta protegida para el escáner
      Archivo: `frontend/app/_layout.tsx` (o `(admin)/_layout.tsx`)
      Ruta: `/eventos/escanear` con verificación de rol admin

- [ ] **US-EV07-26** — Verificar type-check mobile
      Comando: `cd frontend && pnpm tsc --noEmit`

### Fase 5: Integración y QA Final

- [ ] **US-EV07-27** — Pruebas de integración backend (endpoints verify y my-pass)
      Verificar: HMAC válido, QR corrupto, QR reutilizado, registro cancelado, evento cancelado

- [ ] **US-EV07-28** — Prueba end-to-end: registro → QR visible → escaneo → verificación exitosa

- [ ] **US-EV07-29** — Prueba de regresión: registro sin QR (eventos antiguos), cancelación, listado

---

## Dependencias entre tareas

```
US-EV07-01 (migración DB)
     │
     v
US-EV07-02 (env) ──> US-EV07-03 (QrPass VO)
     │                    │
     v                    v
US-EV07-04 (IEventRepository) ──> US-EV07-05 (Postgres impl)
                                         │
                                         v
                                   US-EV07-06 (GenerateQrPass UC)
                                         │
                                         v
                                   US-EV07-07 (modificar RegisterForEvent)
                                         │
                                         v
                                   US-EV07-08 (VerifyQrPass UC) ──> US-EV07-09 (endpoint verify)
                                                                          │
                                                                          v
                                                                     US-EV07-10 (endpoint my-pass)
                                                                          │
                                    ┌─────────────────────────────────────┼─────────────────────────────┐
                                    v                                     v                             v
                              US-EV07-11..15                     US-EV07-16..20                US-EV07-21..26
                              (Web QR display)                   (Mobile QR display)           (Mobile QR scanner)
```

---

## Tiempo estimado

| Fase | Tareas | Estimado |
|------|--------|----------|
| Fase 1 (Backend) | #01–10 | Alto |
| Fase 2 (Web QR) | #11–15 | Medio |
| Fase 3 (Mobile QR) | #16–20 | Medio |
| Fase 4 (Scanner) | #21–26 | Alto |
| Fase 5 (QA) | #27–29 | Medio |
