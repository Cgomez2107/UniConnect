# Gateway (BFF)

Purpose: single API entrypoint for the mobile app.

Current runtime behavior:
- `GET /health` returns service health payload.
- Proxies `GET /api/v1/study-groups` and nested paths to `STUDY_GROUPS_BASE_URL`.
- Keeps the gateway focused on composition and routing, not domain rules.
- Normalizes not-found and unexpected errors as JSON.

Environment variables:
- `PORT`
- `NODE_ENV`
- `STUDY_GROUPS_BASE_URL`

Run locally:
- `pnpm --filter @uniconnect/gateway dev`
