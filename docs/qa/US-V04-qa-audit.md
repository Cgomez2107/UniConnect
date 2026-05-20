# QA Audit: US-V04 Poll Messages

**Auditor**: QA Experto  
**Fecha**: 2026-05-19  
**Scope**: Backend exclusivo (Bloques A, B, C, D)  
**Estado**: ❌ **NO APTA para release** — 2 issues críticos, 2 majors, 2 minors

---

## Resumen por Acceptance Criterion

| AC | Descripción | Status | Hallazgos |
|----|------------|--------|-----------|
| AC1 | Decorator composable sin modificar clase base | ⚠️ PARCIAL | Decorator existe y compila, **nunca se instancia** en el pipeline real |
| AC2 | Voto actualiza resultados en tiempo real vía WebSocket | ✅ PASA | Canal POLL_VOTE_REGISTERED completo, broadcast funcional |
| AC3 | Auto-cierre programado con resultado final | ⚠️ PARCIAL | Scheduler funcional, **evento POLL_CLOSED se pierde si nadie votó** |
| AC4 | Creador ve porcentajes antes del cierre | ⚠️ PARCIAL | Endpoint funcional, **sin verificación de membresía** |
| AC5 | Doble voto rechazado con mensaje claro | ✅ PASA | DuplicateVoteError + UNIQUE constraint, HTTP 400 |
| AC6 | Encuesta distinguible en dashboard web | ✅ PASA (backend) | DTO completo con question/options/results/status |
| AC7 | Mismo endpoint web y mobile | ✅ PASA | Gateway proxy único, sin bifurcación |

---

## 🔴 CRITICAL

### CRIT-01: PollMessageDecorator es unreachable — nunca se instancia

**Archivos**: `PollMessageDecorator.ts`, `CreatePollUseCase.ts`, `main.ts`  
**Severidad**: 🔴 CRITICAL

El `PollMessageDecorator` se crea como un decorator estructural que extiende `MessageDecorator`, pero **ningún código de la aplicación lo instancia**. El decorator está definido en `domain/decorators/` pero:

1. `CreatePollUseCase` solo escribe en DB vía `repository.createPollConfig()` — no wrappea ningún `IMessage`
2. `main.ts` no importa ni usa `PollMessageDecorator`
3. No hay fábrica ni pipeline que componga el decorator con FileDecorator, MentionDecorator, etc.

**Evidencia**:
```
CreatePollUseCase.execute():
  → repository.createPollConfig(input)
  → retorna PollConfigDTO
  // NUNCA: new PollMessageDecorator(msg, pollConfig)
```

**Impacto**: El patrón Decorator del AC1 existe en código pero está **completamente desconectado del flujo real**. Si un frontend envía un mensaje con encuesta, el decorator no se aplica.

**Fix**: Crear un `ComposedMessageFactory` (o similar) en el use case de creación de mensajes de grupo que instancie la cadena: `BaseMessage → FileDecorator → MentionDecorator → ReactionDecorator → PollMessageDecorator` cuando corresponda.

---

### CRIT-02: No hay endpoint HTTP para crear una encuesta

**Archivo**: `pollRoutes.ts`  
**Severidad**: 🔴 CRITICAL

`PollController` expone 3 handlers, pero `pollRoutes.ts` solo rutea 2:
- ✅ `POST /api/v1/polls/:pollId/votes` → `castVote`
- ✅ `GET /api/v1/polls/:pollId/results` → `getPollResults`
- ❌ `POST /api/v1/polls` → `createPollMessage` **no está ruteado**

El handler `createPollMessage` es código **muerto** — nunca será invocado por HTTP.

**Evidencia**: `pollRoutes.ts` líneas 23-24 solo definen dos regex:
```typescript
const votesMatch = requestUrl.pathname.match(/^\/api\/v1\/polls\/([^/]+)\/votes$/);
const resultsMatch = requestUrl.pathname.match(/^\/api\/v1\/polls\/([^/]+)\/results$/);
// NO hay match para POST /api/v1/polls
```

**Fix**: Agregar ruta para `POST /api/v1/polls` en `pollRoutes.ts` o eliminar `PollController.createPollMessage()` si la creación se maneja desde otro servicio.

---

## 🟠 MAJOR

### MAJ-01: get_poll_results RPC no verifica membresía del grupo

**Archivo**: `20260519_US_V04_poll_messages.sql` (RPC `get_poll_results`)  
**Severidad**: 🟠 MAJOR

La función RPC `get_poll_results` es `SECURITY DEFINER` y ejecuta una consulta directa a `poll_configs` **sin verificar** que el usuario autenticado sea miembro del grupo. Las RLS policies quedan bypasseadas dentro de la función.

**Evidencia**: la función solo hace:
```sql
SELECT status, question, options
  INTO v_status, v_question, v_options
FROM poll_configs
WHERE id = p_poll_id;
```
Sin JOIN a `study_requests` ni llamada a `is_request_member()`.

**Impacto**: CUALQUIER usuario autenticado puede llamar:
```sql
SELECT get_poll_results('any-poll-id');
```
Y obtener resultados de encuestas de grupos a los que no pertenece.

**Fix**: Agregar verificación explícita dentro de la función:
```sql
IF NOT is_request_member(
  (SELECT group_id FROM poll_configs WHERE id = p_poll_id),
  auth.uid()
) THEN
  RAISE EXCEPTION 'No tienes permiso para ver esta encuesta' USING ERRCODE = 'P0001';
END IF;
```

---

### MAJ-02: Error de encuesta cerrada retorna HTTP 500 (debería ser 400)

**Archivo**: `PollController.ts`, `InMemoryMessagingRepository.ts`  
**Severidad**: 🟠 MAJOR

Al votar en una encuesta cerrada, el repositorio lanza:
```typescript
throw new Error("La encuesta ya está cerrada");
```
Este `Error` genérico cae en `mapErrorToHttpStatus()` que lo mapea a **HTTP 500 Internal Server Error**. Debería ser 400 (Bad Request — regla de negocio violada).

**Evidencia**: controller.ts línea 88-93, el `catch` para `DuplicateVoteError` retorna 400 explícitamente, pero el `Error` genérico no tiene handler específico.

**Fix**: Crear `PollClosedError extends ApplicationError` con `statusCode = 400` y `code = 'POLL_CLOSED'`, similar a `DuplicateVoteError`.

---

## 🟡 MINOR

### MIN-01: CastVoteUseCase subscribe en cada ejecución (design smell)

**Archivo**: `CastVoteUseCase.ts`:22  
**Severidad**: 🟡 MINOR

Cada vez que se ejecuta `CastVoteUseCase.execute()`, se llama:
```typescript
this.subject.subscribe(channel, this.realtimeObserver);
```
El `ChatSubject.subscribe()` maneja duplicados con un warn log, pero la suscripción debería ocurrir **una vez en bootstrap**, no dentro de la lógica de negocio. Si se ejecutan 1000 votos, hay 999 warns de "ya está en el canal".

**Fix**: Mover la suscripción a `main.ts` junto con las demás suscripciones de observers; eliminar la línea del use case.

---

### MIN-02: PollSchedulerService emite POLL_CLOSED sin observers si nadie votó

**Archivo**: `PollSchedulerService.ts`  
**Severidad**: 🟡 MINOR

Escenario:
1. Admin crea encuesta (no subscribe a nadie)
2. Nadie vota (no subscribe al canal)
3. Scheduler cierra la encuesta
4. `chatSubject.emit(channel, event)` encuentra 0 observers en el canal
5. El evento se loggea y se pierde

El `ChatSubject.emit()` lo maneja sin crash (log + return), pero los clientes conectados **no reciben la notificación de cierre** hasta que hagan polling manual.

**Fix**: No aplicar fix por ahora — es un edge case de baja probabilidad. Documentar como mejora futura (cuando se implemente un WebSocket room manager global).

---

### MIN-03: InMemory percentage rounding usa `Math.round(x * 1000) / 10` en vez de `Math.round(x * 10) / 10`

**Archivo**: `InMemoryMessagingRepository.ts`:343  
**Severidad**: 🟡 MINOR (solo InMemory, no afecta prod)

La fórmula `Math.round((count / totalVotes) * 1000) / 10` es equivalente a `Math.round((count / totalVotes) * 100 * 10) / 10`, que da el mismo resultado que `Math.round((count / totalVotes) * 100 * 10) / 10 = Math.round(percentage * 10) / 10`. Funciona correctamente para 1 decimal, pero es menos legible.

SQL usa `ROUND((cnt::numeric / total) * 100, 1)` que es más claro.

**Fix**: Cambiar a `Math.round((count / totalVotes) * 100 * 10) / 10` o a `Math.round(((count / totalVotes) * 100) * 10) / 10`.

---

## 📊 Resumen Final

| Tipo | Cantidad | IDs |
|------|----------|-----|
| 🔴 CRITICAL | 2 | CRIT-01 (decorator unreachable), CRIT-02 (no route for creation) |
| 🟠 MAJOR | 2 | MAJ-01 (RLS bypass en get_poll_results), MAJ-02 (500 en closed poll) |
| 🟡 MINOR | 3 | MIN-01 (subscribe en cada voto), MIN-02 (POLL_CLOSED sin observers), MIN-03 (rounding legibilidad) |
| ✅ PASS | 3 | AC2 (real-time vote), AC5 (double vote rejection), AC7 (same endpoint) |

**Veredicto**: ❌ **NO APTA para release** — los 2 CRITICAL bloquean la funcionalidad core (decorator nunca se aplica, creación sin endpoint). Se requiere corrección antes de pasar a QA de frontend.
