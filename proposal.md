# Propuesta: Migración a Monorepo - Paquetes Compartidos (Resumen Ejecutivo)

Fecha: 2026-05-08

Objetivo
- Formalizar alcance y mitigaciones para la extracción incremental de código compartido (types, API, state, UI mínima) para que `frontend` (Expo) y `web` (Vite) convivan en un monorepo sin duplicación y con tipado estricto.

Alcance Aprobado (Scope ajustado)
1. Testing (No Mocks): No se crearán nuevas pruebas unitarias con mocks complejos ni pruebas de contrato automatizadas en esta fase. El único testing automatizado obligatorio es el **TypeScript type-check** estricto en CI para todos los paquetes (`pnpm -w -r run typecheck` / `tsc -b`). QA manual y la matriz de regresión existentes siguen vigentes.
2. Capa de Red y Mappers (Pattern Adapter/Mapper): Implementación obligatoria del patrón Adapter/Mapper en `shared-api`. El backend seguirá entregando snake_case; el adaptador/mapeador en `shared-api` convertirá a camelCase antes de exponer datos a `shared-state` y frontends. Este mapper es innegociable.
3. Alcance de `shared-ui`: Mínimo absoluto. Sólo extraer la lógica compartida estrictamente bloqueante para las vistas de **Auth**, **Admin** y **Chat** de este Sprint (headless hooks, tokens, y 2–3 presentational thin components por plataforma si necesario). No construir un Design System completo.

Mitigaciones de Riesgo
- Riesgo: Divergencia entre RN y Web → Mitigación: headless-first; presentar solo contratos/prop shapes compartidos; presentar componentes por plataforma (`.native` / `.web`).
- Riesgo: Rotura de tipado por contratos backend → Mitigación: `shared-types` como fuente de verdad; mappers en `shared-api` obligatorios; type-check CI como puerta de entrada.
- Riesgo: Errores 500 por datos inesperados → Mitigación: runtime lightweight validation opcional (Zod) en `shared-api` mappers sólo en puntos críticos; no obligatorio para todos los endpoints en esta fase.
- Riesgo: cliente de mensajería monolítico y difícil de evolucionar → Mitigación: patrón Decorator (`BaseMessagingClient` + `RealtimeChatDecorator`) para separar HTTP y realtime.
- Riesgo: comportamiento inconsistente de notificaciones entre Web y Mobile → Mitigación: patrón Observer (`NotificationSubject`) con contrato único de suscripción.
- Riesgo: fuga a endpoints de producción en desarrollo local → Mitigación: política local-first obligatoria (`localhost` / red Docker interna), auditoría CI y bloqueo de referencias externas.

Entregables solicitados (esta propuesta solicitará creación incremental):
- `packages/shared-types` (tipos y DTOs)
- `packages/shared-api` (transport, mappers, Auth+Messaging clients)
- `packages/shared-state` (factories de stores: Auth, Notifications, Conversations y adapters de storage)
- `packages/shared-ui` (headless hooks y tokens; mínima surface para Auth/Admin/Chat)
- Actualización `pnpm-workspace.yaml`, `turbo.json` y CI para type-check

Aceptación / Criterios de Éxito
- Todos los paquetes compilan sin errores `tsc` en CI.
- Frontend Web y Mobile pueden consumir `shared-types`, `shared-api` y `shared-state` sin cambiar contratos de llamada (solo wiring/adapters).
- Mapping snake_case→camelCase implementado en `shared-api` y usado por stores.

Siguiente paso
- Con tu aprobación: generar artefactos `design.md` y `tasks.md` (documentación técnica y checklist). Luego aplicar artefactos iniciales bajo `/opsx:propose`.

---

## Requerimientos estrictos añadidos (cumplimiento obligatorio)

1) Patrón Factory vs Singleton
- Implementación obligatoria: todos los stores deben exponerse como *factories* (`createXStore(deps)`) y no como singletons estáticos. Justificación técnica:
	- Facilita inyección de adaptadores (storage, apiClients) según plataforma.
	- Mejora testabilidad y evita estado global difícil de controlar.
	- Alinea con principios SOLID (Single Responsibility y Dependency Inversion).

2) `shared-api` Adapter/Mapper obligatorio
- Ningún snake_case del backend puede llegar a las vistas o stores. `shared-api` debe contener el Mapper central que realiza dos transformaciones:
	- `requestMapper` (camelCase -> snake_case) para payloads salientes
	- `responseMapper` (snake_case -> camelCase) para respuestas entrantes

3) Entorno Local Primero (prohibición expresa)
- En esta fase de desarrollo/QA queda estrictamente prohibido apuntar a URLs de producción o despliegues externos.
- Todas las configuraciones nuevas en `tasks.md` y artefactos deben forzar `localhost` o nombres de servicio Docker (`db`, `auth`, `gateway`, etc.).

4) Principios de Calidad
- Evitar "Fat Models": mantener la lógica de negocio en servicios y use-cases; `shared-api` mapea y valida, `shared-state` orquesta y persiste, `shared-ui` solo contiene lógica de presentación.

5) Patrones en tiempo real y notificaciones
- Decorator obligatorio en chat: `BaseMessagingClient` (HTTP) + `RealtimeChatDecorator` (socket/reconexión).
- Observer obligatorio para notificaciones: `Observable/Subject` compartido, con suscripción idéntica para Web y Mobile.

6) Consistencia de UI por Design Tokens
- Regla de oro: tokens compartidos (color, spacing, typography) como única fuente visual. Web y Mobile los consumen aunque usen primitivas distintas.

Confirmación
- Si estás de acuerdo con estos añadidos, procederé a la generación de los artefactos de código en la próxima fase. Por ahora no modificaré código de aplicación.
