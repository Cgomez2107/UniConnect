# Tareas: Checklist secuencial para migración a paquetes compartidos

Objetivo: lista exhaustiva y ordenada de pasos técnicos para crear `shared-types`, `shared-api`, `shared-state` y `shared-ui`, y migrar consumos mínimos en `frontend` y `web`.

Nota: Todas las tareas deben incluir un pequeño `README.md` en cada paquete explicando la API pública y comandos de build.

Fase 0 — Preparación del monorepo
1. Crear carpeta `packages/` en la raíz si no existe.
2. Actualizar `pnpm-workspace.yaml` para incluir:
   - `packages/*`
3. Añadir/ajustar root `package.json` scripts esenciales:
   - `typecheck`: `pnpm -w -r -s run typecheck`
   - `build`: `pnpm -w -r -s run build`
4. Añadir `turbo.json` (si aplica) para orquestar dependencias: `shared-types` → `shared-api` → `shared-state` → frontends.

Fase 1 — Paquete `shared-types`
5. Crear `packages/shared-types` con:
   - `package.json` (name `@uniconnect/shared-types`, exports, main/module)
   - `src/index.ts` exportando tipos esenciales (AuthProfile, User, Message, Conversation, StudyGroup, DTOs, Error types)
   - `src/schemas/*` (opcional Zod schemas para endpoints críticos)
   - `tsconfig.json` (composite project)
   - `README.md` con guía de uso
6. Mover/copyear tipos existentes de `frontend/types/index.ts` a `shared-types` y ajustar imports localmente (sin romper frontends todavía).
7. Ejecutar `pnpm -w -r run typecheck` y corregir errores de tipos derivados.

Fase 2 — Paquete `shared-api` (Adapter/Mapper obligatorio)
8. Crear `packages/shared-api` con:
   - `package.json` (depends on `@uniconnect/shared-types`)
   - `src/transport/ITransport.ts`
   - `src/transport/axiosTransport.ts` (implementación default)
   - `src/mappers/snakeToCamel.ts` y `camelToSnake.ts`
   - `src/mappers/index.ts` con `responseMapper(response, schema?)` y `requestMapper(payload)` (aplicar convert y opcional Zod validation)
   - `src/clients/AuthClient.ts`
   - `src/clients/messaging/BaseMessagingClient.ts` (HTTP puro)
   - `src/clients/messaging/RealtimeChatDecorator.ts` (WebSocket + reconexión)
   - `src/clients/messaging/index.ts` (composición y exports)
   - `src/index.ts` exportando `createApiClients({ transport, baseURL })`
   - `tsconfig.json`, `README.md`
9. Implementar token injection hook/pattern in transport (auth provider callback).
10. Ejecutar `typecheck` y corregir errores.
11. Implementar patrón Decorator en mensajería:
   - Confirmar que `BaseMessagingClient` no depende de WebSocket.
   - Confirmar que `RealtimeChatDecorator` envuelve base client y añade realtime sin romper contratos.
   - Confirmar mapping snake→camel en eventos entrantes de socket.

Fase 3 — Paquete `shared-state` (factories + adapters)
12. Crear `packages/shared-state` con:
    - `package.json` (depends on `@uniconnect/shared-types` and `@uniconnect/shared-api`)
    - `src/types.ts` (exportar AuthStore, NotificationStore, ConversationsStore interfaces)
    - `src/adapters/storage/IStorageAdapter.ts` + `webStorageAdapter.ts` + `asyncStorageAdapter.ts` + `noopStorageAdapter.ts`
    - `src/factories/createAuthStore.ts` (factory signature `createAuthStore(deps)`)
    - `src/factories/createNotificationStore.ts`
    - `src/factories/createConversationsStore.ts`
    - `src/utils/withPersistence.ts` helper
    - `tsconfig.json`, `README.md`
13. Implementar `createAuthStore` logic portando la lógica del `frontend` actual (sin side-effect directo; usar `deps.apiClients`).
14. Implementar `NotificationSubject` con patrón Observer (API uniforme Web/Mobile):
   - `subscribe`, `unsubscribe`, `notify`.
   - Integrar con eventos de socket del `RealtimeChatDecorator`.
15. Implementar storage adapters and test manual hydration flow.
16. Ejecutar `typecheck` y corregir errores.

Fase 4 — Paquete `shared-ui` (mínimo para Auth/Admin/Chat)
17. Crear `packages/shared-ui` con:
    - `package.json` (exports para web/native)
    - `src/tokens.ts` (colores, spacing minimal)
    - `src/hooks/useAuthForm.ts` (headless)
    - `src/hooks/useChatComposer.ts` (headless)
    - `src/components/Button.web.tsx` & `Button.native.tsx` (solo si absolutamente necesario)
    - `tsconfig.json`, `README.md`
18. Añadir estrategia estricta de Design Tokens:
   - Definir tokens canónicos compartidos (`colors`, `spacing`, `typography`).
   - Prohibir valores hardcodeados en componentes bloqueantes de Auth/Admin/Chat.
19. Verificar que hooks se integren con `shared-state` factories sin acoplar a plataforma.
20. Ejecutar `typecheck`.

Fase 5 — Wiring en frontends (migración incremental)
21. Añadir paths a `tsconfig.json` de cada app para apuntar a `@uniconnect/*`.
22. Cambiar imports en `frontend` y `web` para usar `@uniconnect/shared-types` (primer paso).
23. Cambiar el flujo de Auth en `frontend` y `web` para consumir `createAuthStore` con el `storageAdapter` apropiado (web→webStorage, mobile→asyncStorage).
24. Cambiar llamadas de red en `frontend`/`web` para usar `createApiClients` y clientes del `shared-api`.
25. Integrar `RealtimeChatDecorator` en chat grupal e individual.
26. Integrar `NotificationSubject` (Observer) para suscripción idéntica en Web/Mobile.
27. Validar manualmente en local (docker compose up) que login+oauth+session y realtime funcionan con mappers aplicados.
28. Refactorizar notificaciones y conversation stores para usar `shared-state` factories.

Fase 6 — CI y validación final
29. Update CI pipeline:
    - Step `typecheck`: `pnpm -w -r -s run typecheck` (falla en errores de tipos)
    - Step `build` optionally: `pnpm -w -r -s run build` if needed
30. Merge feature branches incrementally; cada merge debe pasar `typecheck`.

Fase 7 — Limpieza
31. Remover proxies/duplicated stores después de validar migración completa.
32. Documentar en `docs/` la nueva arquitectura y patrones Adapter/Mapper, Decorator y Observer.

Notas operativas
- Hacer commits pequeños y verificables.
- Mantener ramas por paquete si es necesario (por ejemplo `shared-types-refactor`).

Checklist rápido (resumen)
- [ ] packages/shared-types created and typechecked
- [ ] packages/shared-api created and typechecked
- [ ] packages/shared-state created and typechecked
- [ ] packages/shared-ui created and minimal integrated
- [ ] frontends wired to factories for Auth
- [ ] CI updated to enforce typecheck

---

## Requerimientos Operacionales Estrictos (Forzar entorno local)

Estos pasos son obligatorios: en esta fase TODO debe apuntar a `localhost` o a nombres de servicio internos de Docker. Está prohibido apuntar a dominios de producción.

33. Revisar `docker-compose.yml` (raíz y `backend/infra/docker`) y aplicar los cambios:
   - Asegurar que los servicios backend y gateway utilicen variables de entorno que resuelvan a nombres internos (`db`, `auth`, `gateway`, `study-groups`, etc.).
   - Evitar hostnames externos en `environment` o `command` (ej. ninguna referencia `https://*.fly.dev`).

34. Actualizar `.env.example` y `frontend`/`web` config para valores por defecto locales:
   - `AUTH_BASE_URL=http://auth:3102` (o `http://localhost:3102` para local)
   - `GATEWAY_URL=http://gateway:3000` (o `http://localhost:3000`)
   - `DB_HOST=db`
   - Documentar en README cómo sobrescribir variables para staging/prod.

35. Añadir una tarea de comprobación en CI (pre-merge) que detecte URLs explícitas de producción en los paquetes `frontend` y `web` (búsqueda simple en codebase). Fallar la pipeline si se encuentran `fly.dev`, `vercel.app`, `production-domain`.

36. Revisar `frontend` y `web` initializers y asegurar `isDev` branch para redirect URLs en OAuth y que usen `localhost` en local.

37. Añadir task en este checklist para validar localmente con Docker Compose: ejecutar `docker compose up --build` y validar autenticación OAuth (manual) y chat realtime.

38. Política obligatoria local-first:
   - Bloquear en documentación y revisión cualquier referencia activa a entornos de producción durante desarrollo local.
   - Permitir sólo `localhost` y DNS de red interna Docker (`gateway`, `auth`, `db`, etc.).

## Realtime / Chat — tareas adicionales
39. Implementar en `shared-api` la abstracción `IRealtime` y migrar la implementación del chat existente a esa abstracción.
40. Crear adaptadores WebSocket para ambos entornos (browser WebSocket y server WS client) y validación manual de reconexión.

## Auditoría y limpieza final
41. Después de migrar, ejecutar script de auditoría que busque y liste cualquier referencia a URLs externas. Revisar y remover si existe.

