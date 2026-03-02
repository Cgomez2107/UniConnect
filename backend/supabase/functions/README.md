# supabase/functions

Microservicios del backend de UniConnect implementados como Supabase Edge Functions (Deno runtime).

## Estructura

```
functions/
  study-groups/     ← API de solicitudes de estudio y postulaciones
  notifications/    ← Webhooks para push notifications
```

## Estado actual

| Función          | Estado  | Descripción                              |
| ---------------- | ------- | ---------------------------------------- |
| `study-groups`   | STUB    | Plantilla lista para implementar         |
| `notifications`  | STUB    | Plantilla para webhooks de Supabase      |

## Cómo conectar con el frontend

Hoy el frontend usa `lib/api/client.ts` que llama a Supabase directamente.  
Para migrar a una Edge Function, solo cambia ese archivo:

```ts
// ANTES (Supabase directo)
const data = await apiGet<StudyRequest>("study_requests", q => q.select("*"))

// DESPUÉS (Edge Function)
const res = await fetch(`${process.env.EXPO_PUBLIC_FUNCTIONS_URL}/study-groups`)
const data = await res.json()
```

**Ninguna pantalla ni hook cambia.**

## Comandos útiles

```bash
# Inicializar Supabase CLI (primera vez)
supabase init

# Desplegar una función
supabase functions deploy study-groups

# Probar localmente
supabase functions serve study-groups --env-file .env.local

# Ver logs
supabase functions logs study-groups
```

## Variables de entorno necesarias

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # solo para funciones admin
```
