# CONTEXTO FRONTEND - UniConnect

## 1. VISIÓN GENERAL

**App Expo (React Native)** con Expo Router v6, TailwindCSS, Clean Architecture y Zustand.
- **SDK:** Expo ~54.0.33
- **React:** 19.1.0
- **React Native:** 0.81.5
- **Entrada:** `expo-router/entry`
- **Plataformas:** iOS, Android, Web
- **Idioma:** Español (contexto universitario Colombia)
- **Bundle:** `com.juanse108.uniconnet`

---

## 2. ARQUITECTURA

### Clean Architecture (4 capas):

```
Screen (View/Orchestrator)
  └── Hook (UI state + llama servicios)
        └── Service (operaciones de dominio via DI container)
              └── client.ts / httpClient.ts (Supabase / API Gateway)
                    └── Supabase Cloud
```

**Evolución del diseño:** El README original describía 4 capas simples, pero la implementación actual tiene Clean Architecture con DDD:

| Capa | Ubicación | Responsabilidad |
|------|-----------|----------------|
| **Presentación** | `app/` + `components/` | Screens (orquestadores), Componentes (presentacionales) |
| **Aplicación** | `hooks/application/` (33 hooks) | Lógica por pantalla, estado UI, llama casos de uso |
| **Dominio** | `lib/services/domain/` | Entidades, Value Objects, Interfaces de repositorio (14), Casos de uso (~80) |
| **Infraestructura** | `lib/services/infrastructure/` | Implementaciones Api* (REST) y Supabase* (directo), Mappers |
| **DI** | `lib/services/di/container.ts` | Contenedor DI singleton que lazy-inicializa todo |

---

## 3. ESTRUCTURA DE DIRECTORIOS

```
frontend/
├── app/                          # Expo Router - rutas basadas en archivos
│   ├── _layout.tsx               # Layout raíz (Stack navigator)
│   ├── index.tsx                 # Splash / redirect
│   ├── login.tsx                 # Login
│   ├── onboarding.tsx            # Tutorial
│   ├── oauth-callback.tsx        # Callback Google OAuth
│   ├── +not-found.tsx            # 404
│   ├── (tabs)/                   # Tabs autenticados (5 tabs)
│   │   ├── _layout.tsx
│   │   ├── feed.tsx              # Feed principal
│   │   ├── invitaciones.tsx      # Hub de aplicaciones
│   │   ├── mensajes.tsx          # Lista de conversaciones
│   │   ├── eventos.tsx           # Eventos del campus
│   │   └── perfil.tsx            # Perfil propio
│   ├── (admin)/                  # Panel admin
│   │   ├── _layout.tsx
│   │   └── index.tsx             # CRUD admin completo
│   ├── chat/[conversationId].tsx # Chat 1:1
│   ├── study-groups/[id]/        # Detalle y admin de grupos
│   ├── solicitud/[id].tsx        # Detalle de solicitud
│   ├── postular/[id].tsx         # Postularse a grupo
│   ├── perfil-estudiante/[id].tsx # Perfil público
│   ├── recurso/[id].tsx          # Detalle de recurso
│   ├── viewer.tsx                # Visor de archivos
│   ├── nueva-solicitud.tsx       # Modal: crear solicitud
│   ├── subir-recurso.tsx         # Modal: subir recurso
│   ├── editar-perfil.tsx         # Modal: editar perfil
│   └── crear-evento.tsx          # Stub: crear evento
├── components/                   # Componentes reutilizables
│   ├── admin/                    # Panel admin (AdminHeader, AdminTabs, CrudModal, etc.)
│   ├── auth/                     # SessionGuard
│   ├── chat/                     # ChatInput, MessageBubble, ConversationSkeleton
│   ├── dashboard/                # AdminDashboardLayout, GroupChatPanel, etc.
│   ├── feed/                     # FeedHeader, SearchBar, FeedFilterModal, etc.
│   ├── invitaciones/             # HubCards
│   ├── notifications/            # GlobalNotificationModals, RealtimeNotificationHandler
│   ├── onboarding/               # SlideItem, DotsIndicator
│   ├── perfil/                   # ProfileHero, StatsRow, MiniRequestCard
│   ├── shared/                   # SectionCard, EmptyState, LoadingState, SkeletonLoader
│   ├── solicitud/                # StudyGroupDetailScreen, RequestDetailContent, ActionBar
│   └── ui/                       # AuthInput, CardSolicitud, ErrorBanner, PrimaryButton
├── hooks/                        # Custom hooks
│   ├── application/              # 33 hooks por pantalla (useFeedScreen, useLoginScreen, etc.)
│   ├── useAuth.ts                # Hook de autenticación
│   ├── useFeed.ts                # Hook de feed
│   └── useStudyGroupDashboard.ts # Dashboard de grupos
├── lib/                          # Capa de datos
│   ├── supabase.ts               # Cliente Supabase
│   ├── api/
│   │   ├── client.ts             # Abstracción Supabase (apiGet, apiPost, etc.)
│   │   └── httpClient.ts         # Cliente HTTP para API Gateway
│   ├── services/
│   │   ├── domain/               # Entidades, repos (interfaces), casos de uso
│   │   ├── infrastructure/       # Implementaciones (Api*, Supabase*), mappers
│   │   └── di/container.ts       # Contenedor DI singleton (708 líneas)
│   └── storage/
│       └── zustandStorage.ts     # Storage para Zustand (AsyncStorage/SecureStore)
├── store/                        # Zustand stores
│   ├── useAuthStore.ts           # Estado de auth (user, isLoading, signIn, signUp, etc.)
│   ├── useConversationsStore.ts  # Cache de conversaciones persistido
│   ├── useNotificationStore.ts   # Cola de notificaciones con dedup
│   └── useUnreadCountStore.ts    # Badge de no leídos
├── types/                        # Tipos TypeScript
│   ├── index.ts                  # 30+ tipos (338 líneas)
│   └── adminDashboard.ts         # Tipos del dashboard admin de grupos
├── constants/                    # Constantes
│   ├── Colors.ts                 # Paleta de colores (light/dark)
│   └── onboarding.ts             # Slides del tutorial
└── utils/
    └── mockData.ts               # Datos mock para desarrollo offline
```

---

## 4. NAVEGACIÓN (Expo Router v6)

### Layout Raíz (`app/_layout.tsx`)

```
Stack (headerShown: false)
├── index                   → Splash/redirect
├── login                   → Login
├── onboarding              → Tutorial (3 slides)
├── oauth-callback          → Callback Google OAuth
├── (tabs)                  → Grupo de tabs (usuarios autenticados)
├── (admin)                 → Stack admin (solo role admin)
├── chat/[conversationId]   → Chat 1:1
├── nueva-solicitud         → Modal: crear solicitud
├── subir-recurso           → Modal: subir recurso
├── editar-perfil           → Modal: editar perfil
├── solicitud/[id]          → Detalle solicitud
├── study-groups/[id]       → Detalle grupo (index + admin.web.tsx)
├── postular/[id]           → Postularse a grupo
├── perfil-estudiante/[id]  → Perfil público estudiante
├── recurso/[id]            → Detalle recurso
└── viewer.tsx              → Visor de archivos
```

### Tabs (`app/(tabs)/_layout.tsx`)

Protegidos por `SessionGuard` (roles: `estudiante`, `admin`). Admin redirigido a `/(admin)`.

1. **Feed** → Solicitudes, búsqueda estudiantes, recursos
2. **Solicitudes (invitaciones)** → Hub: mis solicitudes, mis postulaciones, mis recursos
3. **Mensajes** → Conversaciones con badge de no leídos
4. **Eventos** → Eventos con filtros por categoría
5. **Perfil** → Perfil propio

---

## 5. PANTALLAS PRINCIPALES

### Auth
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Login | `app/login.tsx` | Email/password + Google OAuth, validación @ucaldas.edu.co |
| Register | `app/(tabs)/register.tsx` | Registro: nombre, email, password, confirmación |
| OAuth Callback | `app/oauth-callback.tsx` | Procesa callback de Google OAuth |

### Feed
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Feed | `app/(tabs)/feed.tsx` | 3 modos: "solicitudes", "compañeros" (búsqueda por materia), "recursos". Pull-to-refresh, scroll infinito, filtros por materia, búsqueda textual |

### Hub de Solicitudes
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Invitaciones | `app/(tabs)/invitaciones.tsx` | 3 tabs: "Mis solicitudes" (con postulantes pendientes), "Mis postulaciones" (pendiente/aceptada/rechazada), "Mis recursos". Botones para revisar postulaciones |

### Chat
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Mensajes | `app/(tabs)/mensajes.tsx` | Lista de conversaciones con badges, timestamps relativos, skeleton loading |
| Chat 1:1 | `app/chat/[conversationId].tsx` | Hilo de chat con bubbles propias/otras, day dividers, reply preview, retry, media viewer, auto-scroll, mark-as-read |

### Perfil
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Perfil propio | `app/(tabs)/perfil.tsx` | Hero (avatar, nombre, programa), info académica, materias actuales (chips), contacto, bio, publicaciones propias, estadísticas, cerrar sesión |
| Perfil público | `app/perfil-estudiante/[id].tsx` | Hero, materias compartidas (intersección con el viewer), bio, FAB de chat flotante |
| Editar perfil | `app/editar-perfil.tsx` | Avatar (cámara/galería), selector de programa, teléfono (+57), selector materias con búsqueda, bio, botón flotante guardar |

### Eventos
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Eventos | `app/(tabs)/eventos.tsx` | Lista con filtros por categoría (academico, cultural, deportivo, otro, pasados), tarjetas animadas, pull-to-refresh |
| Evento detalle | `app/eventos/[id].tsx` | Badge categoría, título, fecha, ubicación, creador, descripción |

### Admin
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Admin panel | `app/(admin)/index.tsx` | 8 tabs: Facultades, Programas, Materias, Usuarios, Solicitudes, Recursos, Eventos, Métricas. CRUD modals, búsqueda, toggles de rol/activo |

### Otras
| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Crear solicitud | `app/nueva-solicitud.tsx` | Título, descripción, selector materia (chips horizontal), contador miembros (2-10), warning si 3+ grupos |
| Postularse | `app/postular/[id].tsx` | Info solicitud, input mensaje (max 500 chars), modal éxito |
| Subir recurso | `app/subir-recurso.tsx` | Título, descripción, selector materia, file picker (PDF/DOCX/XLSX/PPTX/TXT/JPG/PNG, max 10MB) |
| Detalle recurso | `app/recurso/[id].tsx` | Icono archivo, badge tipo, tamaño, materia, autor, descripción, dueño puede editar/eliminar, abrir en viewer |
| Visor archivos | `app/viewer.tsx` | Imágenes (ExpoImage) y documentos (WebView), badge extensión, botón descargar/compartir |
| Dashboard grupo (web) | `app/study-groups/[id]/admin.web.tsx` | Admin grupo: miembros, aplicaciones, chat grupal, transferencias |

---

## 6. COMPONENTES DESTACADOS

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| `CardSolicitud` | `components/ui/CardSolicitud.tsx` | Card de solicitud de estudio en feed |
| `SessionGuard` | `components/auth/SessionGuard.tsx` | Protege rutas por rol, redirige si no autorizado |
| `ChatInput` | `components/chat/ChatInput.tsx` | Input de chat con send, reply preview |
| `MessageBubble` | `components/chat/MessageBubble.tsx` | Burbuja de mensaje (propio/otro), reply, retry, media |
| `StudyGroupDetailScreen` | `components/solicitud/StudyGroupDetailScreen.tsx` | Detalle completo de grupo de estudio |
| `CrudModal` | `components/admin/CrudModal.tsx` | Modal genérico CRUD para admin |
| `GlobalNotificationModals` | `components/notifications/GlobalNotificationModals.tsx` | Modales de notificación globales |
| `RealtimeNotificationHandler` | `components/notifications/RealtimeNotificationHandler.tsx` | Escucha notificaciones en tiempo real via Supabase |
| `HubCards` | `components/invitaciones/HubCards.tsx` | Tarjetas del hub (mis solicitudes, postulaciones, recursos) |
| `AdminDashboardLayout` | `components/dashboard/AdminDashboardLayout.tsx` | Dashboard admin de grupo de estudio |
| `EmptyState` | `components/shared/EmptyState.tsx` | Estado vacío con emoji, título y acción |
| `SkeletonLoader` | `components/shared/SkeletonLoader.tsx` | Placeholder de carga |

---

## 7. HOOKS DE APLICACIÓN (33 en `hooks/application/`)

| Hook | Propósito |
|------|-----------|
| `useLoginScreen` | Estado formulario login, validación, auth actions |
| `useRegisterScreen` | Estado formulario registro, validación, sign-up |
| `useFeedScreen` | Orquestación feed (solicitudes, estudiantes, recursos) |
| `useAdmin` | CRUD del panel admin (8 tabs) |
| `useProfile` | Carga de datos del perfil |
| `useEditProfileForm` | Edición de perfil (avatar, materias, programa, bio, teléfono) |
| `useCreateStudyRequestForm` | Creación de solicitud de estudio |
| `useUploadResourceForm` | Subida de recurso |
| `useInvitationsHub` | Datos del hub de aplicaciones |
| `usePostulationForm` | Postulación a grupo de estudio |
| `useConversations` | Carga de lista de conversaciones |
| `useMessaging` | Mensajes del chat, envío, retry |
| `useChatComposer` | Estado del input de chat (typing, reply) |
| `useStudentProfileScreen` | Perfil público de estudiante |
| `useStudentSearch` | Búsqueda de estudiantes por materia |
| `useResourceDetail` | Detalle, edición y eliminación de recurso |
| `useEvents` | Lista de eventos con filtros |
| `useEventDetailScreen` | Detalle de evento individual |
| `useStudyGroupDashboard` | Dashboard admin de grupo (miembros, apps, mensajes, transferencias) |
| `useGoogleAuth` | Flujo Google OAuth |
| `useOAuthCallbackFlow` | Manejador de callback OAuth |
| `useApplicationsRealtime` | Actualizaciones en tiempo real de postulaciones |

---

## 8. CAPA DE DATOS

### Cliente Supabase (`lib/supabase.ts`)
- `react-native-url-polyfill` para soporte URL
- Storage adapters: AsyncStorage (dev/tunnel) o SecureStore (producción); Web: localStorage
- Auto-refresh token, persist session, detect session in URL

### API Gateway Client (`lib/api/httpClient.ts`)
- `fetchApi<T>(endpoint, options)` → requests autenticados al Gateway
- Obtiene JWT de sesión Supabase (cached 10s TTL)
- Soporte para token manual (`setManualToken`)
- Base URL default: `http://localhost:3000/api/v1`

### Abstracción Supabase (`lib/api/client.ts`)
- `apiGet<T>(table, queryFn)`, `apiPost<T>(table, payload)`, `apiPatch<T>(table, payload, queryFn)`, `apiDelete(table, queryFn)`
- Wrapper tipado sobre el cliente Supabase directo

### DI Container (`lib/services/di/container.ts`)
- `DIContainer` singleton (708 líneas)
- Lazy-inicializa todos los repositorios y casos de uso
- Punto único para intercambiar implementaciones (Supabase ↔ microservicios REST)

### Repositorios Disponibles

**REST API (Api*):**
- ApiStudyRequestRepository, ApiApplicationRepository, ApiStudyResourceRepository
- ApiMessageRepository, ApiConversationRepository, ApiEventRepository
- ApiStudentRepository, ApiFacultyCatalogRepository, ApiAuthRepository

**Supabase directo:**
- SupabaseStudyGroupRepository, SupabaseAuthRepository, SupabaseProfileRepository
- SupabaseResourceUploadRepository, SupabaseAdminPanelRepository

### Casos de Uso por Dominio (~80+)

| Dominio | Casos de Uso |
|---------|-------------|
| **auth** | SignInWithPassword, SignUpWithPassword, SignOutUser, ClearLocalSession, GetCurrentSession, GetMyAuthProfile, SubscribeAuthStateChanges, GetOAuthSignInUrl, ResolveSessionFromOAuthUrl |
| **study-requests** | GetFeedRequests, CreateStudyRequest, UpdateStudyRequest, GetStudyRequestById, GetEnrolledSubjectsForUser, GetAvailableSubjectsForUser, CancelStudyRequest, etc. |
| **applications** | ApplyToStudyRequest, ReviewApplication, GetApplicationsForRequest, GetApplicationsByApplicant, CancelApplication, etc. |
| **messaging** | GetConversations, GetMessages, SendMessage, GetOrCreateConversation, MarkConversationAsRead, GetTotalUnreadCount |
| **resources** | GetStudyResourcesBySubject, UploadStudyResource, DeleteStudyResource, UploadResourceFromDevice, etc. |
| **events** | GetAllEvents, GetUpcomingEvents, GetEventById |
| **students** | SearchStudentsBySubject, GetStudentPublicProfile |
| **profile** | GetProfileByUserId, GetMyPrograms, GetMySubjects, UpdateMyProfile, UploadMyAvatar, AddMySubject, SetPrimaryProgram |
| **faculty-catalog** | GetPrograms, GetSubjectsByProgram |
| **admin** | AdminPanelGateway |

---

## 9. ESTADO GLOBAL (Zustand)

### `useAuthStore` (core)
- Estado: `user`, `isLoading`, `isAuthenticated`, `isHydrating`
- Inicialización vía `onAuthStateChange` de Supabase
- Validación de dominio @ucaldas.edu.co
- Carga en background de perfil, programas, materias
- Registro de push token post-login
- Watchdog de seguridad (15s timeout anti-loop infinito)
- Acciones: `signIn`, `signUp`, `signOut`, `setUser`, `initialize`

### `useConversationsStore`
- Cache de conversaciones persistido (AsyncStorage/SecureStore)
- Hydration detection inteligente

### `useNotificationStore`
- Cola de notificaciones con deduplicación por ID
- Tipos: transferencia_admin_solicitada, transferencia_admin_aceptada, solicitud_ingreso, miembro_aceptado, miembro_rechazado

### `useUnreadCountStore`
- Factory function: `createUnreadCountStore(GetTotalUnreadCount use-case)`
- Throttled refresh (100ms mínimo entre refrescos)
- Acciones: increment, decrement, set, reset, refresh

---

## 10. CONSTANTES Y TIPOS

### Colors (`constants/Colors.ts`)
- Paleta Universidad de Caldas: Azul `#0d2852`, Dorado `#c8ae7a`
- Modo claro/oscuro completo:
  - `background`, `surface`, `primary`, `accent`
  - `text`, `textPrimary`, `textSecondary`, `textPlaceholder`, `textOnPrimary`
  - `border`, `borderFocus`, `borderError`
  - `error`, `errorBackground`, `success`, `successBackground`
  - `icon`, `tabIconDefault`, `tabIconSelected`
- Dark mode: primary → dorado, accent → azul (inversión)

### Types (`types/index.ts` - 338 líneas, 30+ tipos)
- `UserRole`, `AuthProfile`, `Profile`, `UserProgram`, `UserSubject`
- `Faculty`, `Program`, `Subject`
- `RequestStatus`, `ApplicationStatus`, `StudyRequest`, `CreateStudyRequestPayload`
- `Application`, `Message`, `Conversation`, `SendMessagePayload`
- `StudyResource`, `CreateStudyResourcePayload`
- `StudentSearchResult`, `StudentPublicProfile`
- `EventCategory`, `CampusEvent`, `CreateEventPayload`
- `AdminUser`, `AdminRequest`, `AdminResource`, `AdminMetrics`

---

## 11. DECISIONES DE ARQUITECTURA CLAVE

1. **Clean Architecture 4-capas** → Screen → Hook → Service → Client
2. **Expo Router v6** → Rutas basadas en archivos con typed routes
3. **Zustand** → Estado global mínimo (solo auth); el resto en hooks locales
4. **DI Container** → Singleton para testabilidad y fácil intercambio de providers
5. **Dual backend** → Algunos dominios usan REST API (Api*Repositories), otros Supabase directo
6. **Design system** → Modo claro/oscuro vía `Colors[scheme]` + Tailwind classes
7. **UI en español** → Toda la app en español (contexto Universidad de Caldas, Colombia)
8. **Carga background de perfil** → Auth instantáneo mientras se enriquecen datos
9. **Código platform-aware** → Implementaciones separadas web/native (admin.web.tsx, useColorScheme.web.ts)
10. **Push notifications** → Expo Notifications con import dinámico (evita problemas en Expo Go)
11. **TailwindCSS** → Clases utilitarias para estilos consistentes

---

## 12. INFRAESTRUCTURA Y DESPLIEGUE

- **Docker** → Contenedor con Nginx reverse proxy (`nginx.conf`)
- **Fly.io** → Config en `fly.toml`
- **EAS Build** → Config en `eas.json`, workflows draft/production
- **Playwright** → Tests E2E (`tests/us-w01-login.spec.ts`) con mock auth (`window.__E2E_MOCK_AUTH__`)
- **ngrok** → En dev para túneles HTTPS (config en devDependencies)
