# Frontend — UniConnect

App móvil de redes académicas para la Universidad de Caldas. Construida con **React Native + Expo** (Router v6, TypeScript).

## Requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go en el celular (para pruebas físicas)

## Cómo correr

```bash
cd frontend/
npm install
npx expo start
```

Opciones en la terminal de Expo:
- `w` → navegador web (localhost:8081)
- `a` → emulador Android (requiere Android Studio)
- `i` → simulador iOS (solo macOS)
- Escanear QR con Expo Go (celular y PC en el mismo WiFi)

Si estás con hotspot del celular, usa:
```bash
npx expo start --tunnel
```

## Variables de entorno

Crea `frontend/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Notas:
- Para el flujo actual de Google OAuth via Supabase, solo se usan `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Los Client IDs de Google se configuran en Supabase (`Auth > Providers > Google`) y no se leen desde el frontend.

## Prueba local para el equipo

1. Clonar el repo y entrar a `frontend/`.
2. Crear `frontend/.env.local` con la URL y `anon key` del mismo proyecto de Supabase.
3. Ejecutar `npm install`.
4. Levantar Expo con `npx expo start --tunnel`.
5. Abrir Expo Go y escanear el QR.
6. Probar login con un correo `@ucaldas.edu.co`.

Checklist de backend para que funcione en todos los equipos:
- En Supabase, `Auth > Providers > Google` debe estar habilitado.
- En Supabase, `Auth > URL Configuration > Redirect URLs` debe incluir:
  - `exp://*/--/oauth-callback`
  - `exp://*/--/*`
  - `com.juanse108.uniconnet://oauth-callback`
  - `com.juanse108.uniconnet://*`
- `Site URL` debe ser estable (por ejemplo `https://example.com`), no un `exp://...` temporal.

---

## Arquitectura general

```
Pantalla (Screen)
    └── Hook personalizado  (lógica de datos, estado UI)
            └── Servicio    (operaciones de dominio)
                    └── client.ts  (gateway a Supabase / API)
                            └── Supabase Cloud
```

Cada capa tiene una responsabilidad única:

| Capa | Responsabilidad |
|---|---|
| **Screen** | Solo renderizado y navegación. Sin lógica de negocio. |
| **Hook** | Estado UI, llamadas a servicios, transformación de datos para la vista. |
| **Servicio** | Operaciones de dominio (qué datos pedir y cómo). |
| **client.ts** | Único punto de contacto con Supabase. Facilita migrar a otra API sin tocar servicios. |

---

## Flujo de datos

### Autenticación

```
app/_layout.tsx
  └── useAuthStore.initialize()
        └── authService.onAuthStateChange()   ← escucha sesión de Supabase
              → si SIGNED_IN: profileService.getMyProfile()
              → useAuthStore.setUser(session)  ← estado global disponible en toda la app
```

Cualquier pantalla accede al usuario actual con:
```typescript
const user = useAuthStore((s) => s.user);
```

### Carga del feed

```
feed.tsx
  └── useFeed()
        ├── careerService.getFeed()       → SELECT study_requests + joins
        ├── careerService.getMySubjects() → filtro por materias del usuario
        └── estado: requests, filters, isLoading, error
```

### Perfil de usuario

```
perfil.tsx
  └── useProfile(userId)
        ├── profileService.getProfile()     → SELECT profiles
        ├── profileService.getMyPrograms()  → SELECT user_programs + join programs
        └── profileService.getMySubjects()  → SELECT user_subjects + join subjects
```

### Panel de administrador

```
(admin)/index.tsx
  └── useAdmin()
        ├── facultyService.getFaculties()
        ├── facultyService.getPrograms()
        ├── facultyService.getSubjects()
        └── CRUD: create / update / delete en cada tabla
```

---

## Estructura de carpetas

### `app/`
Rutas de la aplicación. Expo Router convierte cada archivo en una ruta automáticamente.

```
app/
  _layout.tsx          Raíz: inicializa sesión, declara Stack de navegación
  index.tsx            Splash/redirect: decide a dónde ir según sesión
  login.tsx            Login email/password + Google OAuth
  onboarding.tsx       Tutorial inicial (solo primera vez)
  editar-perfil.tsx    Modal: editar nombre, bio, programa, materias, foto
  nueva-solicitud.tsx  Modal: crear solicitud de grupo de estudio
  (tabs)/              Navegación por pestañas (estudiante autenticado)
    _layout.tsx        Define las 4 pestañas
    feed.tsx           Feed de solicitudes de estudio
    perfil.tsx         Perfil propio del usuario
    invitaciones.tsx   Postulaciones recibidas/enviadas
    index.tsx          Home tab
  (admin)/             Panel de administración (solo rol "admin")
    _layout.tsx
    index.tsx          CRUD de facultades, programas y materias
  solicitud/
    [id].tsx           Detalle de una solicitud (ruta dinámica)
```

### `components/`
Componentes reutilizables, organizados por dominio.

```
components/
  admin/               Componentes exclusivos del panel admin
    AdminHeader.tsx    Cabecera con título y botón de cierre
    AdminTabs.tsx      Pestañas Facultades / Programas / Materias
    CatalogRow.tsx     Fila de tabla con botones Editar/Eliminar
    CrudModal.tsx      Modal genérico para crear/editar entidades
  feed/                Componentes del feed de solicitudes
    FeedHeader.tsx     Cabecera con título y botón de filtros
    SearchBar.tsx      Barra de búsqueda por texto
    FeedFilterModal.tsx Modal con filtros avanzados (facultad, materia)
  perfil/              Componentes de la pantalla de perfil
    ProfileHero.tsx    Avatar, nombre, semestre y bio del usuario
    StatsRow.tsx       Fila de estadísticas (solicitudes, postulaciones)
    MiniRequestCard.tsx Tarjeta compacta de solicitud propia
  onboarding/          Componentes del tutorial inicial
    SlideItem.tsx      Slide individual del onboarding
    DotsIndicator.tsx  Indicador de página (puntos)
  shared/              Componentes genéricos usados en varias pantallas
    SectionCard.tsx    Contenedor con título de sección
    EmptyState.tsx     Vista vacía con icono y mensaje
    LoadingState.tsx   Indicador de carga centrado
    InfoRow.tsx        Fila de información label + valor
    StatBox.tsx        Caja de estadística con número y etiqueta
  ui/                  Componentes UI base del design system
    AuthInput.tsx      Input estilizado para formularios de auth
    CardSolicitud.tsx  Tarjeta completa de solicitud en el feed
    Errorbanner.tsx    Banner de error rojo
    Primarybutton.tsx  Botón primario de la app
    SplashLoader.tsx   Pantalla de carga con logo
```

### `hooks/`
Hooks personalizados. Cada uno encapsula la lógica de datos de una pantalla.

```
hooks/
  useAuthStore.ts     → en store/ (Zustand global)
  useAdmin.ts         Lógica CRUD del panel admin
  useFeed.ts          Datos y filtros del feed de solicitudes
  useProfile.ts       Datos del perfil del usuario
  useFaculties.ts     Lista de facultades (usado en formularios)
  useAuth.ts          Helpers de autenticación para componentes
  useColorScheme.ts   Tema claro/oscuro
  useThemeColor.ts    Acceso a colores del tema activo
```

### `lib/`
Capa de acceso a datos.

```
lib/
  supabase.ts          Cliente Supabase inicializado con variables de entorno
  api/
    client.ts          Gateway: apiGet, apiGetOne, apiPost, apiPatch, apiDelete
  services/
    authService.ts     signIn, signUp, signOut, onAuthStateChange, getMyProfile
    profileService.ts  getProfile, updateProfile, uploadAvatar, getMyPrograms, getMySubjects
    careerService.ts   getFeed, getMyRequests, createRequest, applyToRequest
    facultyService.ts  CRUD de faculties, programs, subjects
    studyRequestsService.ts  Variantes de consulta de solicitudes
    googleAuthService.ts     Login con Google OAuth
```

### `store/`
Estado global con Zustand.

```
store/
  useAuthStore.ts   Sesión del usuario: user, isLoading, signIn, signOut, initialize
```
Solo se usa para la sesión. El resto del estado vive en los hooks de cada pantalla.

### `types/`
Tipos TypeScript del dominio. **Fuente única de verdad**: todos los servicios y componentes importan desde aquí.

```
types/
  index.ts   UserRole, AuthProfile, Profile, UserProgram, UserSubject,
             Faculty, Program, Subject,
             RequestStatus, ApplicationStatus,
             StudyRequest, CreateStudyRequestPayload, Application
```

### `constants/`
Valores fijos de la aplicación.

```
constants/
  Colors.ts       Paleta de colores institucionales (azul UC + dorado) — light y dark
  roles.ts        Roles disponibles: "estudiante" | "admin"
  onboarding.ts   Contenido de los slides del tutorial
```

### `assets/`
Recursos estáticos.

```
assets/
  fonts/    SpaceMono-Regular.ttf
  images/   icon.png, splash-icon.png, adaptive-icon.png, favicon.png
```

### `utils/`

```
utils/
  mockData.ts   Datos de prueba para desarrollo offline (Faculty, Profile, StudyRequest)
```

### `scripts/`

```
scripts/
  reset-project.js   Limpia el proyecto Expo a estado inicial
  testBackend.ts     Script de prueba de conexión a Supabase
  testFlow.ts        Script de prueba de flujo completo auth + perfil
```

---

## Design system

Colores institucionales definidos en `constants/Colors.ts`:

| Token | Light | Dark |
|---|---|---|
| `primary` | `#0d2852` (azul UC) | `#c8ae7a` (dorado) |
| `accent` | `#c8ae7a` (dorado) | `#1a3d73` |
| `background` | `#f8f9fa` | `#0a0a0a` |
| `textPrimary` | `#212529` | `#ffffff` |
| `error` | `#dc3545` | `#ff6b6b` |
| `success` | `#198754` | `#51cf66` |

Todos los componentes leen colores a través de:
```typescript
const scheme = useColorScheme() ?? "light";
const C = Colors[scheme];
```
