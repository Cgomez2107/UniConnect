# Hallazgos: Diagnóstico de Notificaciones

## Pipeline Completo

### Backend → DB → API
1. `NotificationMapper` mapea eventos de dominio → `NotificacionDTO[]`
2. `NotificationObserver` recibe eventos via `StudyGroupSubject`
3. Llama a `NotificationService.notificar(dto)` → estrategias activas
4. `InAppWebSocketStrategy`: (a) persiste en `user_notifications` via repository, (b) emite broadcast a `user-notifications:{userId}` via Supabase Realtime
5. API `GET /api/v1/notifications` → `PostgresNotificationRepository.listByUser()` → `get_user_notifications()` function

### Frontend → API
1. `App.tsx` llama `fetchNotifications()` cada 30s + `useRealtimeNotifications()` suscribe a Supabase channel `user-notifications:{userId}`
2. `fetchNotifications()` → `NotificationsClient.list()` → GET `/notifications` → gateway → study-groups
3. Response se mapea via `mapNotificationDtoToDomain()` → store de Zustand
4. `NotificationItem` renderiza title, description (body), data (payload), priority

### SessionScheduler (recordatorios)
1. Iniciado en `main.ts:444` con `scheduler.start()`
2. Cada 30s: `findPendingReminders()` → `SELECT ... WHERE remind_at <= NOW() AND reminder_sent_at IS NULL AND remind_at IS NOT NULL`
3. Por cada sesión: calcula minutos restantes, llama `notificationService.notificar()` directamente (no via NotificationMapper)
4. Marca `markReminded()`

## Problemas Identificados

### 1. Realtime broadcast solo funciona con Supabase configurado
- Si `supabaseUrl` o `supabaseServiceRoleKey` no están en env → `realtimeGateway = null` → `InAppWebSocketStrategy` no se crea → sin broadcast en tiempo real
- La notificación SÍ se persiste en DB (via `InMemoryNotificationRepository` o Postgres), y el polling cada 30s la recupera

### 2. Preferencias de canal en memoria
- Sin pool de BD, `preferenceRepository` es `null`, se usa fallback que retorna `null` en `getCanalesActivos`
- `PreferenceService` maneja `null` devolviendo canales por defecto (excluye email para priority normal)
- Pero `InAppWebSocketStrategy` puede no existir si no hay realtimeGateway

### 3. SessionScheduler necesita Postgres
- `createSessionRepositories(pool)` → solo con `pool` devuelve Postgres repos; sin pool usa InMemory
- En in-memory, `findPendingReminders()` nunca encuentra nada porque nadie llama a `create()` con `remindAt`
- El scheduler se inicia igual, pero no hay datos en memoria

### 4. Migración `remind_at` no aplicada
- La columna `remind_at` fue eliminada por `20260525_study_sessions.sql` que DROP/CREATE la tabla
- La migration `20260606_add_remind_at_to_study_sessions_fix.sql` fue creada pero no aplicada aún
- Sin la columna, `INSERT` de `remind_at` falla y `findPendingReminders()` no encuentra nada

## Conclusión
El pipeline de código es correcto. Los problemas son de entorno/configuración:
- Sin Supabase configurado → sin WebSocket en tiempo real (pero polling cada 30s debería funcionar)
- Sin migration de BD → `remind_at` no existe → recordatorios no funcionan
- Sin pool de BD → in-memory mode sin datos persistentes
