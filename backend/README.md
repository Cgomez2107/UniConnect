# Backend — UniConnect

Microservicios de UniConnect implementados como **Supabase Edge Functions** (runtime Deno).

## Requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- Acceso al proyecto en [supabase.com](https://supabase.com)

## Comandos

```bash
# Desde esta carpeta (backend/)

# Autenticarse
supabase login

# Vincular con el proyecto remoto
supabase link --project-ref <project-ref>

# Desplegar funciones
supabase functions deploy study-groups
supabase functions deploy notifications

# Probar localmente (levanta un servidor Deno local)
supabase start
supabase functions serve study-groups --env-file supabase/.env.local

# Ver logs en producción
supabase functions logs study-groups --tail
```

## Funciones disponibles

| Función          | Ruta                         | Estado  | Descripción                          |
| ---------------- | ---------------------------- | ------- | ------------------------------------ |
| `study-groups`   | `supabase/functions/study-groups/`  | STUB    | API REST de solicitudes de estudio   |
| `notifications`  | `supabase/functions/notifications/` | STUB    | Webhooks para push notifications     |

## Variables de entorno

Crea `supabase/.env.local`:
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Conexión con el frontend

El frontend consume estas funciones a través de `frontend/lib/api/client.ts`.  
Para activar una Edge Function en vez de Supabase directo, actualiza ese archivo:

```ts
// ANTES — Supabase directo
const data = await apiGet<StudyRequest>("study_requests", q => q.select("*"))

// DESPUÉS — Edge Function
const res = await fetch(`${process.env.EXPO_PUBLIC_FUNCTIONS_URL}/study-groups`)
const data = await res.json()
```

**Solo `client.ts` cambia. Nada en pantallas, hooks ni componentes.**
