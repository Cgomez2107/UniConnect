# ============================================================================
# STAGE 1: BUILDER - Compilación de TypeScript
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalación de herramientas necesarias
RUN apk add --no-cache python3 make g++

# Copiar archivos de lock para reproducibilidad
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Instalar pnpm globalmente
RUN npm install -g pnpm@9.12.0

# Instalar dependencias (solo prod, dev se excluirá en runner)
RUN pnpm install --frozen-lockfile --prod

# Copiar todo el código fuente
COPY . .

# Compilar TypeScript con turbo (genera dist en cada servicio)
RUN pnpm build

# ============================================================================
# STAGE 2: RUNTIME - Imagen mínima en Alpine
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=3000

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar solo archivos de producción desde builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./

# Copiar solo dist compilado (sin source .ts)
COPY --from=builder --chown=nodejs:nodejs /app/gateway/dist ./gateway/dist
COPY --from=builder --chown=nodejs:nodejs /app/services ./services

# Cambiar a usuario no-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Exponer puerto
EXPOSE 3000

# Por defecto, iniciar gateway
CMD ["node", "gateway/dist/main.js"]
