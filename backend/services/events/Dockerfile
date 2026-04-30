# Build service image for events
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9.12.0 && pnpm config set store-dir /pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY services/events/package.json services/events/tsconfig.json ./services/events/
COPY shared ./shared
COPY services/events/src ./services/events/src

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @uniconnect/events build
RUN pnpm prune --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/events/node_modules ./services/events/node_modules
COPY --from=builder /app/services/events/dist ./services/events/dist
USER nodejs
EXPOSE 3000
CMD ["node", "services/events/dist/services/events/src/main.js"]
