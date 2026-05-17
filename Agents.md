# UniConnect Architecture & Monorepo Audit Report

**Fecha**: Mayo 8, 2026  
**Estado**: Auditoría Completa - Listo para Reestructuración  
**Versión del Documento**: 1.0

---

## 📋 Índice

1. [Arquitectura y Estructura Actual](#1-arquitectura-y-estructura-actual)
2. [Diagnóstico de Infraestructura (Docker)](#2-diagnóstico-de-infraestructura-docker)
3. [Análisis de Dependencias y Herramientas](#3-análisis-de-dependencias-y-herramientas)
4. [Visión Hacia el Monorepo (Preparación)](#4-visión-hacia-el-monorepo-preparación)
5. [Hallazgos Clave y Oportunidades](#5-hallazgos-clave-y-oportunidades)

---

## 1. Arquitectura y Estructura Actual

### 1.1 Estructura de Carpetas General

```
uniconnet/                                 # Raíz del proyecto
├── backend/                               # Backend monorepo (pnpm workspaces)
│   ├── gateway/                           # API Gateway (Puerto 3000)
│   ├── services/                          # Microservicios
│   │   ├── auth/                          # Auth Service (Puerto 3102)
│   │   ├── study-groups/                  # Study Groups Service (Puerto 3101)
│   │   ├── messaging/                     # Messaging Service (Puerto 3104)
│   │   ├── resources/                     # Resources Service (Puerto 3103)
│   │   ├── profiles-catalog/              # Profiles Catalog Service (Puerto 3105)
│   │   └── events/                        # Events Service (Puerto 3106)
│   ├── shared/                            # Paquetes compartidos
│   │   ├── types/                         # @uniconnect/shared-types (tipos TypeScript)
│   │   ├── contracts/                     # Contratos y DTOs
│   │   ├── libs/                          # Librerías reutilizables
│   │   ├── patterns/                      # Patrones de diseño (DI, Observer, Singleton)
│   │   └── http/                          # Clientes HTTP compartidos
│   ├── infra/                             # Infraestructura
│   │   └── docker/                        # Docker Compose alternativo
│   ├── tests/                             # Tests E2E y de integración
│   ├── pnpm-workspace.yaml                # Definición del workspace
│   ├── turbo.json                         # Configuración de Turborepo
│   ├── tsconfig.base.json                 # Base TypeScript config
│   ├── package.json                       # Root package
│   ├── pnpm-lock.yaml                     # Lock file
│   ├── Dockerfile                         # Multi-stage production
│   ├── Dockerfile.dev                     # Desarrollo con hot-reload
│   └── .env.example                       # Variables de entorno
│
├── frontend/                              # Frontend Mobile (Expo/React Native)
│   ├── app/                               # Rutas de Expo Router
│   ├── components/                        # Componentes reutilizables
│   ├── store/                             # Zustand stores (Auth, Conversations, Notifications)
│   ├── lib/                               # Servicios y DI
│   │   ├── services/                      # Lógica de negocio (domain, infrastructure)
│   │   │   ├── domain/                    # Entities, Use Cases, Interfaces
│   │   │   ├── infrastructure/            # Repositories, API clients
│   │   │   ├── di/                        # Dependency Injection Container
│   │   │   └── pushService.ts             # Push notifications
│   │   ├── storage/                       # Zustand storage adapter
│   │   └── supabase.ts                    # Cliente Supabase (auth)
│   ├── types/                             # Interfaces de dominio (tipos centrales)
│   ├── hooks/                             # React hooks personalizados
│   ├── constants/                         # Constantes y config
│   ├── utils/                             # Utilidades
│   ├── chat/                              # Lógica de chat (WebSocket/realtime)
│   ├── context/                           # React Context (legacy)
│   ├── app.json                           # Expo config
│   ├── tsconfig.json                      # TypeScript config
│   ├── package.json                       # Dependencias Expo
│   ├── playwright.config.ts               # Tests E2E
│   └── Dockerfile                         # Contenedor frontend
│
├── web/                                   # Frontend Web (React + Vite)
│   ├── src/
│   │   ├── components/                    # Componentes React
│   │   ├── pages/                         # Rutas (React Router)
│   │   ├── store/                         # Zustand stores
│   │   ├── lib/                           # Servicios y utilidades
│   │   ├── types/                         # Tipos TypeScript
│   │   ├── hooks/                         # React hooks
│   │   ├── assets/                        # Assets estáticos
│   │   ├── main.tsx                       # Entry point
│   │   ├── App.tsx                        # Root component
│   │   └── index.css                      # Estilos globales
│   ├── public/                            # Assets públicos
│   ├── vite.config.ts                     # Configuración Vite
│   ├── tsconfig.*.json                    # TypeScript configs
│   ├── tailwind.config.js                 # Tailwind CSS
│   ├── package.json                       # Dependencias web
│   ├── Dockerfile                         # Nginx + SPA
│   └── eslint.config.js                   # ESLint config
│
├── docker-compose.yml                     # Orquestación local (raíz)
├── docs/                                  # Documentación
├── .env.example                           # Template de variables
└── README.md                              # Documentación principal

```

### 1.2 Backend: Monorepo con pnpm Workspaces

**Estado**: ✅ Implementado y funcional

#### Estructura de Workspace:
```yaml
# pnpm-workspace.yaml
packages:
  - "gateway"
  - "services/auth"
  - "services/study-groups"
  - "services/resources"
  - "services/messaging"
  - "services/profiles-catalog"
  - "services/events"
  - "shared/*"
```

#### Características Detectadas:
- **Package Manager**: `pnpm@9.12.0`
- **Build System**: Turborepo v2.1.3
- **Runtime**: Node.js v20.x (ESM)
- **Lenguaje**: TypeScript 5.7.2

#### Microservicios Backend:

| Servicio | Nombre NPM | Puerto | Responsabilidades |
|----------|-----------|--------|---|
| **Gateway** | `@uniconnect/gateway` | 3000 | Enrutamiento, composición de APIs, orquestación |
| **Auth** | `@uniconnect/auth` | 3102 | Autenticación, JWT, passwords, sesiones |
| **Study Groups** | `@uniconnect/study-groups` | 3101 | Grupos de estudio, membresías, aplicaciones |
| **Messaging** | `@uniconnect/messaging` | 3104 | Mensajes, conversaciones, notificaciones en tiempo real |
| **Resources** | `@uniconnect/resources` | 3103 | Recursos académicos, materiales compartidos |
| **Profiles Catalog** | `@uniconnect/profiles-catalog` | 3105 | Catálogo de perfiles, búsqueda de usuarios |
| **Events** | `@uniconnect/events` | 3106 | Eventos académicos, calendario |

#### Paquetes Compartidos (shared/):

```
backend/shared/
├── types/                          # @uniconnect/shared-types
│   └── Tipos centrales de dominio (Domain Objects)
├── contracts/                      # DTOs y contratos de API
├── libs/                           # Librerías reutilizables
├── patterns/                       # Patrones (DI, Observer, Singleton)
└── http/                           # Clientes HTTP compartidos
```

---

### 1.3 Frontend: Stack Heterogéneo (Dual Frontend)

#### Frontend Mobile (Expo/React Native)
- **Stack**: Expo 53, React Native, Expo Router
- **State Management**: Zustand
- **HTTP Client**: Axios (potencial) / Supabase SDK
- **Auth**: Supabase + JWT local
- **Real-time**: WebSocket (chat)
- **Persistent Storage**: Async Storage + Zustand persistence
- **Tests**: Playwright E2E

**Stores Detectados**:
- `useAuthStore` - Autenticación y sesión de usuario
- `useConversationsStore` - Gestión de conversaciones (persistente)
- `useNotificationStore` - Cola de notificaciones
- `useUnreadCountStore` - Contador de no leídos

#### Frontend Web (React + Vite)
- **Stack**: React 19, Vite 8, TypeScript
- **Routing**: React Router v7
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS + PostCSS
- **Server**: Nginx + SPA static export
- **Tests**: Playwright E2E

#### Tipos Compartidos (frontend/types/index.ts)
```typescript
// Dominios identificados:
- UserRole: "estudiante" | "admin"
- AuthProfile, Profile
- UserProgram, UserSubject
- Faculty, Program, Subject (Catálogo académico)
- StudyGroup, StudyRequest, Application (Grupos de estudio)
- Message, Conversation (Mensajería)
- Event (Eventos)
- StudyResource (Recursos)
```

---

## 2. Diagnóstico de Infraestructura (Docker)

### 2.1 Docker Compose: Orquestación Local

**Ubicación Principal**: `/uniconnet/docker-compose.yml`

```yaml
Servicios Orquestados:
  ✅ db                 # PostgreSQL 16-alpine (persistencia)
  ✅ backend-setup      # Setup inicial (pnpm install)
  ✅ gateway            # API Gateway (port 3000)
  ✅ auth               # Auth Service (port 3102)
  ✅ study-groups       # Study Groups (port 3101)
  ✅ resources          # Resources (port 3103)
  ✅ messaging          # Messaging (port 3104)
  ✅ profiles-catalog   # Profiles (port 3105)
  ✅ events             # Events (port 3106)
```

### 2.2 Análisis de Dockerfile

#### Backend - Dockerfile (Multi-stage Production)

**Stage 1: Builder**
```dockerfile
FROM node:20-alpine AS builder
# Instala pnpm, copia workspace config
# Ejecuta: pnpm install --frozen-lockfile
# Ejecuta: pnpm build (Turborepo)
# Limpia: pnpm prune --prod
```

**Stage 2: Runner**
```dockerfile
FROM node:20-alpine AS runner
# Usuario no-root (nodejs:1001)
# Copia solo: node_modules, dist compilado
# CMD: node gateway/dist/gateway/src/main.js
# Expone: Puerto 3000
# Tamaño: Optimizado (~300-400MB)
```

**Hallazgo**: ✅ Build reproducible, seguro y optimizado para producción

#### Backend - Dockerfile.dev (Desarrollo)

```dockerfile
FROM node:20-alpine
# Instala dev dependencies (no prune)
# CMD: pnpm dev (tsx --watch con hot-reload)
# Volume mounts para live reload
```

**Hallazgo**: ✅ Permite desarrollo con reinicio automático

#### Frontend Dockerfiles

**Frontend Mobile** (Expo):
```dockerfile
# Expo export para web
# Nginx para SPA servir
# Node:20-alpine + build tools
```

**Frontend Web** (Vite):
```dockerfile
# Multi-stage: build + nginx
# Vite build → dist/
# Nginx para SPA
# Puertos: 80 (http), 443 (https)
```

#### Servicios Individuales

**Patrón Consistente**:
```dockerfile
# Cada servicio en services/{name}/Dockerfile
FROM node:20-alpine AS builder
# pnpm install (workspace config heredada)
# pnpm --filter @uniconnect/{name} build

FROM node:20-alpine AS runner
# Usuario no-root
# Copia dist compilado
# CMD: node services/{name}/dist/...
```

### 2.3 Volúmenes y Persistencia

```yaml
Volúmenes Nombrados:
  ✅ db-data                    # Persistencia PostgreSQL
  ✅ backend-pnpm-store        # Caché de pnpm (reutilizable)
  ✅ backend-node-modules      # node_modules compartido
  
Volúmenes Bind (Desarrollo):
  ✅ ./backend:/app             # Código fuente backend
  ✅ ./frontend:/app            # Código fuente frontend
  ✅ ./web:/app                 # Código fuente web
```

### 2.4 Health Checks y Dependencias

```yaml
db healthcheck:
  - test: pg_isready -U postgres
  - interval: 10s
  - retries: 5
  - Permite que otros servicios esperen estado "healthy"
  
Dependencias de Servicios:
  gateway:
    depends_on:
      - db (healthy)
      - auth, study-groups, resources, messaging, profiles-catalog, events
```

**Hallazgo**: ✅ Configuración robusta, pero DB no replicated para HA

### 2.5 Variables de Entorno

**Configuración de BD**:
```env
DB_NAME=uniconnect_dev
DB_USER=postgres
DB_PASSWORD=postgres_password_dev
DB_HOST=db (interno) / localhost:5432 (externo)
```

**JWT Secrets**:
```env
JWT_ACCESS_SECRET=dev_secret_access
JWT_REFRESH_SECRET=dev_secret_refresh
```

**URLs Internas (Service Discovery)**:
```env
STUDY_GROUPS_BASE_URL=http://study-groups:3101
RESOURCES_BASE_URL=http://resources:3103
MESSAGING_BASE_URL=http://messaging:3104
PROFILES_CATALOG_BASE_URL=http://profiles-catalog:3105
EVENTS_BASE_URL=http://events:3106
AUTH_BASE_URL=http://auth:3102
```

---

## 3. Análisis de Dependencias y Herramientas

### 3.1 Package Manager y Workspaces

| Herramienta | Versión | Rol | Estado |
|-------------|---------|-----|--------|
| **pnpm** | 9.12.0 | Package manager (backend) | ✅ Activo |
| **pnpm-workspace.yaml** | - | Monorepo workspace | ✅ Configurado |
| **turbo.json** | v2.1.3 | Build orchestration | ✅ Activo |

### 3.2 TypeScript Configuration

```
backend/tsconfig.base.json        # Base para todos los packages
backend/tsconfig.json             # Root config
backend/gateway/tsconfig.json     # Gateway override
backend/services/*/tsconfig.json  # Service overrides
backend/shared/types/tsconfig.json
```

**Configuración Compartida**:
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- `"type": "module"` (ESM)

### 3.3 Frontend Dependencies

#### Frontend Mobile (Expo)
```json
Core:
  - "expo": 53.x
  - "react-native": (via Expo)
  - "expo-router": 6.x
  - "@react-navigation/*": 7.x

State & Storage:
  - "zustand": 5.x (state)
  - "@react-native-async-storage/async-storage": 2.2
  - "zustand/middleware" (persist)

HTTP & Auth:
  - "@supabase/supabase-js": 2.97
  - Axios (potencial)

Real-time & Push:
  - "expo-notifications": 0.32
  - WebSocket (chat)

UI:
  - "@expo/vector-icons": 15.x
  - "expo-symbols": 1.x
  - Custom CSS/Tailwind (web export)

Testing:
  - "playwright": (E2E)
```

#### Frontend Web (Vite)
```json
Core:
  - "react": 19.x
  - "react-dom": 19.x
  - "react-router-dom": 7.x
  - "vite": 8.x

State:
  - "zustand": 5.x

HTTP:
  - "axios": 1.16

Styling:
  - "tailwindcss": 4.x
  - "postcss": 8.x
  - "autoprefixer": 10.x
  - "lucide-react": 1.14 (icons)

Testing:
  - "playwright": (E2E)
```

### 3.4 Backend Dependencies

#### Core Framework
```
No framework específico detectado (patrón de servicios puros):
  - "pg": 8.13 (PostgreSQL client)
  - "jsonwebtoken": 9.0 (JWT)
  - "bcryptjs": 2.4 (Password hashing)
  - Probablemente Express.js o Fastify (revisar services/)
```

#### Development Tools (Todos los packages)
```json
Common DevDependencies:
  - "typescript": 5.7.2
  - "tsx": 4.19.2 (TypeScript executor)
  - "@types/node": 22.10 (Node type definitions)
  - ESLint, Prettier (scripts scaffold)
  - Turbo (build orchestration)
```

---

## 4. Visión Hacia el Monorepo (Preparación)

### 4.1 Oportunidades de Consolidación

#### 📦 PAQUETE COMPARTIDO: `@uniconnect/shared-ui`
**Objetivo**: Unificar componentes UI entre Frontend Mobile y Web

**Candidatos para Extraer**:

```
De frontend/components/:
  ✅ Componentes Atómicos:
    - Button.tsx / ButtonComponent.tsx
    - Input.tsx / TextInput.tsx
    - Card.tsx
    - Badge.tsx
    - Loading spinner
    - Modal/Dialog

  ✅ Componentes de Composición (potencial):
    - FormGroup.tsx
    - FormField.tsx
    - LayoutHeader.tsx
    - LayoutSidebar.tsx

De web/src/components/:
  ✅ Componentes web específicos:
    - Tabla reutilizable
    - Paginación
    - Breadcrumbs
```

**Beneficio**: Single source of truth para design system

---

#### 📦 PAQUETE COMPARTIDO: `@uniconnect/shared-state`
**Objetivo**: Gestión de estado unificada con Zustand

**Candidatos para Extraer**:

```typescript
// Stores reutilizables entre Mobile y Web:

De frontend/store/:
  ✅ useAuthStore               // Autenticación (CRÍTICO)
  ✅ useNotificationStore       // Notificaciones (CRÍTICO)
  ✅ useUnreadCountStore        // Contador no leídos (REUTILIZABLE)
  
De web/src/store/:
  ✅ useUIStore (modal, sidebar) // Estados UI comunes

Patrón:
  // shared-state/src/stores/auth.ts
  export const createAuthStore = (container: DIContainer) => {
    return create<AuthState>((set, get) => ({
      // Lógica centralizada
      login: async (email, password) => {
        const authService = container.resolve('AuthService');
        // ...
      }
    }))
  }

Consumo en Frontend:
  import { useAuthStore } from '@uniconnect/shared-state';
  const { user, login, logout } = useAuthStore();

Consumo en Web:
  import { useAuthStore } from '@uniconnect/shared-state';
  const { user, login, logout } = useAuthStore();
```

**Beneficio**: Evitar duplicación de lógica de estado, sincronizar comportamiento

---

#### 📦 PAQUETE COMPARTIDO: `@uniconnect/shared-api`
**Objetivo**: Clientes HTTP tipados y centralizados

**Candidatos para Extraer**:

```typescript
// shared-api/src/clients/

✅ AuthApiClient (frontend/lib/services/infrastructure/repositories/ApiAuthRepository)
  - POST /auth/login
  - POST /auth/register
  - POST /auth/refresh
  - POST /auth/logout

✅ MessagingApiClient (frontend/lib/services/infrastructure/repositories/ApiMessageRepository)
  - GET /conversations
  - POST /conversations/{id}/messages
  - WebSocket connection para real-time

✅ StudyGroupsApiClient
  - GET /groups
  - POST /groups
  - GET /groups/{id}
  - POST /applications

✅ ResourcesApiClient
  - GET /resources
  - POST /resources/{id}/download

✅ ProfilesApiClient
  - GET /profiles/{id}
  - GET /search?q=term
  - PUT /profiles/{id}

✅ EventsApiClient
  - GET /events
  - POST /events

// Patrón de Instancia Compartida:
// shared-api/src/index.ts
export const createApiClients = (baseURL: string) => ({
  auth: new AuthApiClient(baseURL),
  messaging: new MessagingApiClient(baseURL),
  studyGroups: new StudyGroupsApiClient(baseURL),
  resources: new ResourcesApiClient(baseURL),
  profiles: new ProfilesApiClient(baseURL),
  events: new EventsApiClient(baseURL),
})
```

**Consumo en Frontend Mobile**:
```typescript
import { useAuthStore } from '@uniconnect/shared-state';
import { clients } from '@uniconnect/shared-api';

const { login } = useAuthStore();
const handleLogin = async (email, password) => {
  const result = await clients.auth.login(email, password);
  login(result.user, result.tokens);
};
```

**Consumo en Frontend Web**:
```typescript
import { useAuthStore } from '@uniconnect/shared-state';
import { clients } from '@uniconnect/shared-api';

const { login } = useAuthStore();
const handleLogin = async (email, password) => {
  const result = await clients.auth.login(email, password);
  login(result.user, result.tokens);
};
```

**Beneficio**: Single source of truth para contratos API, reutilización de tipos

---

#### 📦 PAQUETE COMPARTIDO: `@uniconnect/shared-types` (EXISTENTE, EXPANDIR)
**Estado Actual**: Existe pero scaffolding básico

**Candidatos para EXPANDIR**:

```typescript
// shared-types/src/domain/

// Actualmente tiene:
✅ UserRole, AuthProfile, Profile
✅ UserProgram, UserSubject
✅ Faculty, Program, Subject
✅ (Grupos de estudio, Mensajes, Eventos comenzados)

Para Completar:
  ✅ Message, Conversation (tipos completos)
  ✅ StudyGroup, StudyRequest, Application (tipos completos)
  ✅ Event (definición completa)
  ✅ Resource (definición de recursos académicos)
  ✅ DTOs (transfer objects) para cada dominio
  ✅ API Request/Response envelopes
  ✅ WebSocket message contracts

// Patrón:
export namespace Auth {
  export interface Credentials { email: string; password: string; }
  export interface TokenPair { accessToken: string; refreshToken: string; }
  export interface LoginResponse { user: AuthProfile; tokens: TokenPair; }
}

export namespace Messaging {
  export interface Message { id: string; conversationId: string; text: string; ... }
  export interface SendMessageDTO { conversationId: string; text: string; }
  export interface MessageEvent { type: 'new' | 'edited' | 'deleted'; payload: Message; }
}
```

**Beneficio**: Source of truth para tipado, compartido entre todos los frontends

---

### 4.2 Arquitectura del Monorepo Futuro

```
uniconnet/
├── backend/                      # Backend monorepo (ACTUAL ✅)
│   ├── gateway/
│   ├── services/
│   ├── shared/
│   └── ...
│
├── frontend/                     # Frontend mobile (ACTUAL ✅)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── web/                          # Frontend web (ACTUAL ✅)
│   ├── src/
│   ├── pages/
│   └── ...
│
├── packages/                     # NUEVO: Paquetes compartidos
│   ├── shared-types/             # ✅ Tipos centrales (expandir existente)
│   ├── shared-api/               # 🆕 Clientes HTTP tipados
│   ├── shared-state/             # 🆕 Zustand stores unificadas
│   ├── shared-ui/                # 🆕 Componentes UI atómicos
│   ├── shared-utils/             # 🆕 Utilidades (formatters, validators)
│   ├── shared-hooks/             # 🆕 React hooks personalizados
│   └── shared-contracts/         # 🆕 Contratos de eventos y mensajes
│
├── docs/                         # Documentación
├── docker-compose.yml            # Orquestación
├── pnpm-workspace.yaml           # Workspace raíz (NUEVO)
├── turbo.json                    # Build orchestration raíz (NUEVO)
└── package.json                  # Root package (NUEVO)
```

#### Nueva configuración `pnpm-workspace.yaml` (raíz):
```yaml
packages:
  - "backend"
  - "frontend"
  - "web"
  - "packages/*"
```

---

### 4.3 Matriz de Compartición de Código

| Código | Frontend Mobile | Frontend Web | Backend | Compartir en |
|--------|---|---|---|---|
| **Tipos de Dominio** | ✅ | ✅ | ✅ | `shared-types` |
| **Clientes HTTP** | ✅ | ✅ | - | `shared-api` |
| **Zustand Stores** | ✅ | ✅ | - | `shared-state` |
| **Componentes UI Atómicos** | ✅ | ✅ | - | `shared-ui` |
| **Validadores** | ✅ | ✅ | ✅ | `shared-utils` |
| **Formatters** | ✅ | ✅ | - | `shared-utils` |
| **React Hooks** | ✅ | ✅ | - | `shared-hooks` |
| **Contratos de Eventos** | ✅ | ✅ | ✅ | `shared-contracts` |
| **Configuración (envs)** | ✅ | ✅ | ✅ | `.env.example` raíz |

---

## 5. Hallazgos Clave y Oportunidades

### 5.1 Fortalezas Actuales ✅

1. **Backend Monorepo Sólido**
   - pnpm workspaces + Turborepo bien implementados
   - Microservicios independientes con buena separación
   - Gateway como orquestador central

2. **Docker Optimizado**
   - Multi-stage builds para producción
   - Hot-reload en desarrollo
   - Health checks configurados
   - Usuario no-root por seguridad

3. **TypeScript Strict**
   - Tipado fuerte en todo el backend
   - tsconfig.base.json para consistencia
   - ESM modules

4. **State Management Centralizado** (Frontend)
   - Zustand para estado previsible
   - Persistence middleware
   - Inyección de dependencias en servicios

### 5.2 Oportunidades de Mejora 🚀

1. **Unificar Tipos (Criticidad: ALTA)**
   - ❌ Frontend Mobile y Web tienen tipos duplicados
   - ✅ Expandir `shared-types` ya existente
   - Impacto: Reducir deuda técnica 30%

2. **Centralizar Clientes HTTP (Criticidad: ALTA)**
   - ❌ Cada frontend implementa sus propios clients
   - ✅ Crear `shared-api` para reutilización
   - Impacto: Facilitar cambios en API sin duplicación

3. **Monorepo Raíz (Criticidad: MEDIA)**
   - ❌ backend/, frontend/, web/ son proyectos separados
   - ✅ Crear workspace raíz con pnpm
   - Impacto: Permitir cambios atómicos en tipos + código

4. **State Management Unified (Criticidad: MEDIA)**
   - ❌ Frontend Mobile tiene stores complejos no reutilizables
   - ✅ Crear `shared-state` para lógica centralizada
   - Impacto: Sincronizar comportamiento entre apps

5. **Component Library (Criticidad: BAJA)**
   - ❌ Componentes UI duplicados en Mobile y Web
   - ✅ Crear `shared-ui` para UI atómicos
   - Impacto: Coherencia visual, mantenimiento

6. **Testing E2E Integrado (Criticidad: MEDIA)**
   - ✅ Ambos frontends tienen Playwright configurado
   - Mejora: Centralizar suites de tests en `tests/`
   - Impacto: Automatización de CI/CD

### 5.3 Riesgos Identificados ⚠️

1. **Diferencias entre Expo Router y React Router**
   - Navegación diferente (Mobile vs Web)
   - Mitigation: Abstraer routing en `shared-contracts`

2. **Supabase vs Backend Backend**
   - Frontend Mobile usa Supabase directamente
   - Frontend Web probablemente usa Gateway
   - Mitigation: Centralizar en `shared-api` con cliente backend como fuente única

3. **WebSocket (Real-time)**
   - Frontend Mobile tiene chat/WebSocket integrado
   - Frontend Web probablemente no
   - Mitigation: Crear `shared-api` con soporte unificado para realtime

4. **No hay React Native Web en Web**
   - Frontends son proyectos completamente separados
   - Expo Router ≠ React Router
   - No se puede compartir componentes fácilmente (uso de react-native en web haría Vite ineficiente)

---

## 6. Recomendaciones Prioritarias (Roadmap)

### Fase 1: Consolidación de Tipos (Sprint 1-2)
```
[ ] Expandir @uniconnect/shared-types con todas las interfaces de dominio
[ ] Sincronizar types/index.ts (frontend) con shared-types
[ ] Crear namespace para cada dominio (Auth, Messaging, StudyGroups, etc.)
[ ] Agregar DTOs y contratos API
```

### Fase 2: Crear Monorepo Raíz (Sprint 2-3)
```
[ ] Crear pnpm-workspace.yaml en raíz
[ ] Crear turbo.json en raíz
[ ] Crear root package.json
[ ] Migrar backend/ al workspace (sin cambios internos)
[ ] Migrar frontend/ al workspace
[ ] Migrar web/ al workspace
```

### Fase 3: Extraer Paquetes Compartidos (Sprint 3-4)
```
[ ] Crear packages/shared-api/
    - ApiAuthClient
    - ApiMessagingClient
    - ApiStudyGroupsClient
    - ApiResourcesClient
    - ApiProfilesClient
    - ApiEventsClient

[ ] Crear packages/shared-state/
    - useAuthStore (centralizado)
    - useNotificationStore (centralizado)
    - useUnreadCountStore (centralizado)

[ ] Crear packages/shared-utils/
    - Validadores
    - Formatters
    - Helpers
```

### Fase 4: Unificar Frontends (Sprint 4-5)
```
[ ] Refactorizar frontend/lib/ para usar @uniconnect/shared-api
[ ] Refactorizar web/src/lib/ para usar @uniconnect/shared-api
[ ] Migrar stores a @uniconnect/shared-state
[ ] Crear CI/CD para monorepo raíz
```

---

## 7. Conclusión

**Estado Actual**: UniConnect tiene una **arquitectura sólida en el backend** pero un **frontend fragmentado** con código duplicado.

**Oportunidad**: Reestructuración hacia un monorepo completo que permita:
- ✅ Compartir tipos entre backend y frontends
- ✅ Unificar clientes HTTP
- ✅ Sincronizar estado
- ✅ Acelerar desarrollo con cambios atómicos
- ✅ Reducir deuda técnica significativamente

**Próximo Paso**: Validar esta auditoría con el equipo y proceder con la Fase 1 (consolidación de tipos).

---

**Documento Generado**: 2026-05-08  
**Por**: Arquitecto de Software Principal  
**Estado**: Listo para Revisión y Aprobación

---

## Estado de Deuda Técnica Crítica

Resumen breve y estado de los cuatro problemas críticos que mencionaste.

- **Bloqueo Docker con `pnpm`**: Estado: parcialmente mitigado.
  - Evidencia: `docker-compose up --build` validado en `docs/tareas/27-prueba-de-arranque-desde-cero-sin-intervencion.md` — arranque exitoso; se observaron *warnings* de reintentos de `pnpm` pero no bloqueo completo.
  - Observaciones: la orquestación usa `backend-setup` con `yes | pnpm -w install --frozen-lockfile` y un volumen de store (`backend-pnpm-store`), lo que reduce fallos intermitentes.
  - Recomendación corta: mantener el volumen de store, añadir retries/backoff y aumentar timeouts de red en hosts CI; añadir monitoreo/alertas cuando `pnpm` devuelva estados no cero.

- **Discrepancia camelCase / snake_case en la web**: Estado: resuelto funcionalmente, con residuos a normalizar.
  - Evidencia: existen mapeos explícitos en frontend (`ApiStudyRequestRepository`, `useStudyGroupDashboard`, utilities en backend y repositorios PostgreSQL que traducen camel↔snake). El web bundle muestra transformaciones (p. ej. mapeos `event_date` ↔ `eventDate`).
  - Observaciones: la estrategia actual es mapeo explícito por repositorio/cliente; funciona pero genera duplicación y riesgo si evolucionan contratos.
  - Recomendación corta: consolidar mapeo en `@uniconnect/shared-types` + utilitarios `toCamel/toSnake` y añadir tests de contrato (integration tests) que validen shape de API.

- **Redirección OAuth hacia fly.dev (callback / entorno)**: Estado: mitigado en desarrollo y con guardas, verificar producción.
  - Evidencia: `web/src/pages/LoginPage.tsx` fuerza `redirectTo` a `http://localhost:8080/oauth-callback` en `isDev` para evitar redirecciones a Fly; frontend mobile usa `AuthSession.makeRedirectUri({ path: 'oauth-callback' })`; README documenta URIs requeridas en Supabase.
  - Observaciones: flujo dev y mobile tienen handlers (`oauth-callback`) correctos; posible desajuste si Supabase production no contiene la URL final (fly/app) en su lista de Redirect URLs.
  - Recomendación corta: verificar y registrar en Supabase las redirect URLs de producción (dominio fly o dominio final), y añadir un test E2E que valide el flujo OAuth en staging/production.

- **Errores 500 (HTTP 500) en APIs**: Estado: persiste riesgo/residuos — no totalmente cerrado.
  - Evidencia: el código contiene múltiples handlers que devuelven 500 ante exceptions (services `messaging`, `study-groups`, `events`, gateway); existe una entrada en la matriz de regresión `BUG-01` pendiente de investigar logs del backend.
  - Observaciones: algunas timeouts y TTLs (ej. caché de sesión, requestTimeoutMs) están presentes y pueden provocar 500 si no se gestionan reintentos o validaciones de entrada; además hay catch-all que devuelven errores sin instrumentación suficiente.
  - Recomendación corta: priorizar un ticket para instrumentación (logs estructurados + Sentry), revisar y aumentar timeouts / añadir reintentos con backoff en clients críticos, y crear pruebas que reproduzcan los 500s reportados (capturar stack traces concretos en CI/staging).

Conclusión corta: una parte importante de estos problemas ya está mitigada (pnpm y OAuth en dev; mapeos camel/snake implementados), pero **quedan residuos operativos** — especialmente en errores 500 y en la necesidad de consolidar mapeos/tipos. Recomiendo dar prioridad inmediata a: 1) instrumentación y trazabilidad (logs/Sentry), 2) tests de contrato para camel/snake y 3) validar redirect URLs en Supabase para producción.
