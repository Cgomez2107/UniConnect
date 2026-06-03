# Auth Service

Servicio de autenticación para UniConnect.

## Setup

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_ACCESS_SECRET=tu_secreto_para_access_tokens
JWT_REFRESH_SECRET=tu_secreto_para_refresh_tokens
```

### 3. Ejecutar migraciones en Supabase

1. Abrir [Supabase SQL Editor](https://app.supabase.com/project/_sql)
2. Copiar el contenido de `migrations/001_create_users_and_tokens.sql`
3. Ejecutar el script

O desde la terminal:

```bash
psql $DATABASE_URL < migrations/001_create_users_and_tokens.sql
```

### 4. Iniciar el servicio

```bash
pnpm dev
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/signup` | Registrar nuevo usuario |
| POST | `/signin` | Iniciar sesión |
| POST | `/refresh` | Renovar token |
| GET | `/google` | Obtener URL OAuth Google |
| POST | `/oauth/callback` | Callback OAuth Google |
| GET | `/session` | Verificar sesión actual |
| GET | `/health` | Health check |

## Dominio institucional

Solo se permiten correos `@ucaldas.edu.co` para:
- Signup (validación explícita)
- Signin (validación explícita)
- Google OAuth (hd=ucaldas.edu.co)

## Tests

```bash
pnpm test:integration
```
