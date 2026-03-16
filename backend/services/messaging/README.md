# messaging service - Configuration Scaffold

Domain scope: US-011, US-015, US-016

Current status:
- Configuration-only scaffold.
- Clean architecture folder layout is in place.
- No business logic implemented yet.

Folder intent:
- src/domain: entities and repository contracts.
- src/application: use-cases orchestration.
- src/infrastructure: DB, HTTP adapters, messaging adapters.
- src/interfaces: controllers/routes/middlewares/dto.
