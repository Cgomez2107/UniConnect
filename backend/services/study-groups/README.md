# study-groups service

Domain scope: US-009, US-012, US-013, US-017

Current status:
- Clean-architecture executable baseline implemented.
- HTTP routes:
	- `GET /health`
	- `GET /api/v1/study-groups?subjectId=&search=`
- 	- `GET /api/v1/study-groups/:id`
- 	- `POST /api/v1/study-groups`
- 	- `GET /api/v1/study-groups/:id/applications`
- 	- `POST /api/v1/study-groups/:id/apply`
- 	- `PUT /api/v1/study-groups/applications/:id/review`
- Uses a Postgres repository when DB env vars are configured.
- Falls back to an in-memory repository when local credentials are missing or still set to placeholders.
- Applications are modeled inside this service as part of the same domain boundary.
- Write flows currently use `x-user-id` as temporary actor identity until JWT middleware is introduced.

Layer responsibilities:
- `src/domain`: entities and repository contracts.
- `src/application`: use-cases orchestration.
- `src/infrastructure`: current data adapters (in-memory now, Postgres later).
- `src/interfaces`: HTTP controllers/routes/dto.

Observer UML:

```mermaid
classDiagram
	class StudyGroupSubject {
		+subscribe(observer)
		+unsubscribe(observer)
		+emit(event)
	}

	class IObserver {
		<<interface>>
		+handle(event)
	}

	class NotificationObserver {
		+handle(event)
	}

	class WebSocketNotificationObserver {
		+handle(event)
	}

	StudyGroupSubject --> IObserver : notifies
	IObserver <|.. NotificationObserver
	IObserver <|.. WebSocketNotificationObserver
```

State diagram — Transferencia de Administrador:

```mermaid
stateDiagram-v2
    [*] --> Activo
    Activo --> PendienteTransferencia : solicitar()\ntransferId = uuid()
    PendienteTransferencia --> TransferenciaAceptada : aceptar()
    PendienteTransferencia --> Activo : rechazar()
    TransferenciaAceptada --> Activo : transferir()\nadminId = targetUserId
    TransferenciaAceptada --> Activo : rechazar()\n(delegates to parent)
    Activo --> [*] : Disuelto / Bloqueado\n(todas las operaciones lanzan error)

    note right of Activo
        Estado base.
        solicitar() transiciona a
        PendienteTransferencia.
        aceptar/rechazar/transferir
        lanzan error.
    end note

    note right of PendienteTransferencia
        Almacena targetUserId y
        transferId para la
        Transicion.
        aceptar/rechazar son validas.
    end note

    note right of TransferenciaAceptada
        Estado "commit".
        transferir() actualiza
        adminId y vuelve a Activo.
    end note
```

State pattern — IState contract:

```typescript
interface IState {
  setContext(context: IGroupContext): void;
  solicitar(): Promise<void>;
  aceptar(): Promise<void>;
  rechazar(): Promise<void>;
  transferir(): Promise<void>;
}
```

All 4 transfer methods are parameterless — data flows through `IGroupContext` properties (`targetUserId`, `transferId`), not method params. Transitions are atomic: each state class only imports its direct transition targets.

Event-driven persistence: `PersistenceObserver` listens to `TRANSFERENCIA_ADMIN_ACEPTADA` and calls `acceptTransferAtomically()` on the admin transfer repository, decoupling DB writes from use-case orchestration.

Run locally:
- `pnpm --filter @uniconnect/study-groups dev`
