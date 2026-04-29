# Build service image for resources
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9.12.0 && pnpm config set store-dir /pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY services/resources/package.json services/resources/tsconfig.json ./services/resources/
COPY shared ./shared
COPY services/resources/src ./services/resources/src

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @uniconnect/resources build
RUN pnpm prune --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/resources/node_modules ./services/resources/node_modules
COPY --from=builder /app/services/resources/dist ./services/resources/dist
USER nodejs
EXPOSE 3000
CMD ["node", "services/resources/dist/services/resources/src/main.js"]
