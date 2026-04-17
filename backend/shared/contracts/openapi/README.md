# OpenAPI contracts

This folder stores API contract versions used by frontend and backend.

Rules:
- Freeze contract changes per sprint.
- Keep backwards compatibility whenever possible.
- Use explicit error payloads: 401, 403, 404, 409, 422, 500.
- Keep pagination shape consistent across domains.

Current version: openapi.v1.yaml (configuration-only skeleton)
