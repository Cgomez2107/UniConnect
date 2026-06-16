# ============================================================================
# Dockerfile — Monolito Modular (Falso Microservicio)
# Compila gateway + 7 microservicios en UN SOLO contenedor.
# Todos se comunican por localhost; solo el puerto 3000 se expone al exterior.
# ============================================================================
# Contexto de build: raíz del monorepo (./fly.toml → dockerfile = backend/Dockerfile)
# ============================================================================

# ── FASE BUILDER ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@9.12.0

# Workspace definido en backend/pnpm-workspace.yaml:
#   "gateway"       → backend/gateway
#   "services/*"    → backend/services/*
#   "shared"        → backend/shared
#   "../packages/*" → packages/* (desde la raíz del monorepo)

WORKDIR /app

# 1. Manifiestos + configs del workspace (capa cacheable)
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml backend/.npmrc backend/tsconfig.base.json backend/tsconfig.json ./backend/

# 2. Paquetes compartidos del monorepo
COPY packages ./packages

# 3. Código fuente del backend
COPY backend/gateway  ./backend/gateway
COPY backend/services ./backend/services
COPY backend/shared   ./backend/shared

# 4. Instalar TODAS las dependencias
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile

# 5. Compilar shared-types + gateway + todos los microservicios en una sola capa
#    - shared-types necesita un symlink porque está fuera de la raíz del workspace
#    - Para forzar rebuild de shared-types, se limpia .tsbuildinfo primero
RUN rm -rf /app/packages/shared-types/node_modules /app/packages/shared-types/tsconfig.tsbuildinfo && \
    ln -sf /app/backend/node_modules /app/packages/shared-types/node_modules && \
    pnpm --filter @uniconnect/shared-types build && \
    pnpm --filter @uniconnect/gateway build && \
    pnpm --filter @uniconnect/auth build && \
    pnpm --filter @uniconnect/study-groups build && \
    pnpm --filter @uniconnect/resources build && \
    pnpm --filter @uniconnect/messaging build && \
    pnpm --filter @uniconnect/profiles-catalog build && \
    pnpm --filter @uniconnect/events build && \
    pnpm --filter @uniconnect/academic-qna build && \
    pnpm --filter @uniconnect/chatbot build

# ── FASE RUNNER — MONOLITO MODULAR ──────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# pnpm en runtime para ejecutar start:all (usa concurrently desde node_modules)
RUN npm install -g pnpm@9.12.0

WORKDIR /app/backend

# Copiar todo el workspace compilado + node_modules con concurrently
COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs

# Solo el gateway se expone; los microservicios se comunican internamente
EXPOSE 3000

# start:all lanza gateway (3000) + 7 servicios (3101-3107) concurrentemente
CMD ["pnpm", "start:all"]
