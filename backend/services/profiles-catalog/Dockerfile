# Build service image for profiles-catalog
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9.12.0 && pnpm config set store-dir /pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY services/profiles-catalog/package.json services/profiles-catalog/tsconfig.json ./services/profiles-catalog/
COPY shared ./shared
COPY services/profiles-catalog/src ./services/profiles-catalog/src

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @uniconnect/profiles-catalog build
RUN pnpm prune --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/profiles-catalog/node_modules ./services/profiles-catalog/node_modules
COPY --from=builder /app/services/profiles-catalog/dist ./services/profiles-catalog/dist
USER nodejs
EXPOSE 3000
CMD ["node", "services/profiles-catalog/dist/services/profiles-catalog/src/main.js"]
