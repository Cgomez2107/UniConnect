FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo root files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy shared packages
COPY packages/ packages/
COPY web/ web/

# Copy only the OpenAPI spec needed by shared-types generate-api-types
COPY backend/gateway/src/public backend/gateway/src/public

# Install all dependencies with pnpm
RUN pnpm install --frozen-lockfile

# ============================================================================
# Phase 1: Build shared-types — validate dist/ has expected structure
# ============================================================================
RUN pnpm --filter @uniconnect/shared-types build && \
    echo "=== dist/schemas/ ===" && \
    ls /app/packages/shared-types/dist/schemas/ && \
    echo "=== VERIFY ===" && \
    test -f /app/packages/shared-types/dist/schemas/_common.schema.js && \
    echo "shared-types dist: OK" || \
    (echo "FATAL: shared-types dist is incomplete — tsc emitted no files"; exit 1)

# ============================================================================
# Phase 2: Build remaining shared packages
# ============================================================================
RUN pnpm --filter @uniconnect/shared-api build && \
    test -f /app/packages/shared-api/dist/index.js && \
    echo "shared-api: OK"
RUN pnpm --filter @uniconnect/shared-hooks build && echo "shared-hooks: OK"
RUN pnpm --filter @uniconnect/shared-utils build && echo "shared-utils: OK"
RUN pnpm --filter @uniconnect/shared-state build && echo "shared-state: OK"
RUN pnpm --filter @uniconnect/shared-ui build && echo "shared-ui: OK"

# ============================================================================
# Phase 3: Build web app with VITE_* variables
# ============================================================================
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_WS_URL=ws://localhost:3000
ENV VITE_WS_URL=$VITE_WS_URL
ARG VITE_SUPABASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN cd /app/web && pnpm vite build

FROM nginx:stable-alpine AS runner
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]