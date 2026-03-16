# Backend — UniConnect

Capa de backend de UniConnect. Combina **Supabase Cloud** (base de datos, autenticación y almacenamiento gestionados) con **Supabase Edge Functions** (microservicios en runtime Deno) para lógica de negocio avanzada.

---

## Arquitectura general

El objetivo del monorepo Node es migrar hacia cinco microservicios de dominio:
- `study-groups`
- `resources`
- `messaging`
- `profiles-catalog`
- `events`

Notas de frontera:
- `applications` se absorbe dentro de `study-groups` como subdominio.
- `admin` no se modela como microservicio independiente; queda como capacidad de autorizacion/orquestacion por dominio.

```
Frontend (Expo)
    │
    ├── lib/api/client.ts         ← gateway: todas las peticiones pasan por aquí
    │       │
    │       ├── Supabase PostgREST API    ← SELECT / INSERT / UPDATE / DELETE directo
    │       │       │
    │       │       └── PostgreSQL (Supabase Cloud)
    │       │               ├── profiles          Perfiles de usuario
    │       │               ├── faculties         Facultades
    │       │               ├── programs          Programas académicos
    │       │               ├── subjects          Materias
    │       │               ├── program_subjects  Relación N:N programa-materia
    │       │               ├── user_programs     Programas inscritos por usuario
    │       │               ├── user_subjects     Materias inscritas por usuario
    │       │               ├── study_requests    Solicitudes de grupos de estudio
    │       │               └── applications      Postulaciones a solicitudes
    │       │
    │       └── Supabase Edge Functions  ← microservicios (Deno, deploy en Supabase)
    │               ├── /study-groups    lógica de feed y postulaciones (STUB)
    │               └── /notifications   push notifications via webhooks  (STUB)
    │
    └── Supabase Auth             ← autenticación: email/password + Google OAuth
    └── Supabase Storage          ← almacenamiento de avatares de usuario
```

### ¿Por qué Edge Functions si ya existe PostgREST?

PostgREST cubre las operaciones CRUD simples. Las Edge Functions están pensadas para cuando se necesita:
- Lógica de negocio compleja que no puede vivir en el cliente
- Validaciones cruzadas entre tablas
- Integraciones con servicios externos (push notifications, emails, etc.)
- Endpoints que agregan datos de múltiples tablas en una sola llamada

---

## Flujo de datos por funcionalidad

### Autenticación

```
Frontend → Supabase Auth (email/password o Google OAuth)
         ← JWT token  (incluido automáticamente en cada petición siguiente)

Frontend → SELECT profiles WHERE id = auth.uid()
         ← {full_name, role, avatar_url, semester, bio}
```

El token JWT permite que las políticas **RLS (Row Level Security)** de PostgreSQL restrinjan automáticamente qué datos puede ver cada usuario.

### Feed de solicitudes

```
Frontend → GET study_requests
             JOIN subjects (name)
             JOIN profiles (full_name, avatar_url)
           WHERE status = 'abierta' AND is_active = true
         ← lista de StudyRequest con datos del autor y materia

         [Filtros opcionales]
           WHERE faculty_name = ?    ← filtro por facultad
           WHERE subject_id = ?      ← filtro por materia
           ilike title | description ← búsqueda por texto
```

Actualmente este flujo pasa por PostgREST. Cuando `study-groups` Edge Function esté activa, el mismo flujo pasará por `fetch("/functions/v1/study-groups")` — solo cambia `client.ts`.

### Postulación a un grupo

```
Frontend → INSERT applications {request_id, applicant_id, message}
         ← {id, status: "pendiente"}

         [Trigger de BD]
         applications (INSERT) → Supabase Database Webhook
                               → Edge Function "notifications"
                               → Expo Push API → push al autor
```

### Operaciones administrativas

```
Frontend (rol: admin)
  → CRUD faculties:   INSERT / UPDATE / DELETE (RLS solo permite admin)
  → CRUD programs:    INSERT / UPDATE / DELETE
  → CRUD subjects:    INSERT / UPDATE / DELETE
                      + gestión de relación N:N en program_subjects
```

---

## Estructura de carpetas

```
backend/
  README.md
  supabase/
    functions/
      README.md          Guía de comandos Supabase CLI
      study-groups/
        index.ts         Edge Function: API REST de grupos de estudio
      notifications/
        index.ts         Edge Function: webhook para push notifications
```

### `supabase/functions/study-groups/index.ts`

**Estado:** STUB — estructura completa, lógica pendiente de implementar.

Rutas planeadas:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/study-groups` | Feed de solicitudes abiertas |
| `POST` | `/study-groups` | Crear solicitud de grupo |
| `GET` | `/study-groups/:id` | Detalle de una solicitud |
| `POST` | `/study-groups/:id/apply` | Postularse a una solicitud |
| `PUT` | `/study-groups/:id/review` | Aceptar o rechazar postulación |

Cuando esta función esté activa, en `frontend/lib/api/client.ts` se cambia una línea:
```typescript
// Antes (PostgREST directo):
supabase.from("study_requests").select(...)

// Después (Edge Function):
fetch(`${FUNCTIONS_URL}/study-groups`, { headers: { Authorization: ... } })
```
Ningún hook ni pantalla necesita cambiar.

### `supabase/functions/notifications/index.ts`

**Estado:** STUB — estructura completa, integración con Expo Push pendiente.

Se dispara mediante **Database Webhooks** de Supabase:

| Evento | Tabla | Acción |
|---|---|---|
| `INSERT` | `applications` | Notifica al autor que alguien se postuló |
| `UPDATE status='aceptada'` | `applications` | Notifica al postulante que fue aceptado |
| `UPDATE status='rechazada'` | `applications` | Notifica al postulante que fue rechazado |

---

## Seguridad — RLS (Row Level Security)

Las políticas de PostgreSQL garantizan que cada usuario solo accede a sus propios datos, sin importar desde dónde haga la petición:

| Tabla | Lectura | Escritura |
|---|---|---|
| `profiles` | Solo el propio perfil | Solo el propio perfil |
| `study_requests` | Cualquier usuario autenticado | Solo el autor |
| `applications` | El autor de la solicitud + el postulante | Solo el postulante |
| `faculties`, `programs`, `subjects` | Cualquier usuario autenticado | Solo rol `admin` |

---

## Requisitos para trabajar con Edge Functions

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker Desktop (para pruebas locales con `supabase start`)

## Comandos

```bash
# Desde la raíz del proyecto o desde backend/

# Autenticarse en Supabase
supabase login

# Vincular con el proyecto remoto
supabase link --project-ref <project-ref>

# Desplegar una función
supabase functions deploy study-groups
supabase functions deploy notifications

# Probar localmente
supabase start
supabase functions serve study-groups --env-file supabase/.env.local

# Ver logs en tiempo real
supabase functions logs study-groups --tail
```

## Variables de entorno para Edge Functions

Crea `backend/supabase/.env.local`:
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

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
