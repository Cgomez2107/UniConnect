# Build service image for messaging
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9.12.0 && pnpm config set store-dir /pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY services/messaging/package.json services/messaging/tsconfig.json ./services/messaging/
COPY shared ./shared
COPY services/messaging/src ./services/messaging/src

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @uniconnect/messaging build
RUN pnpm prune --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/messaging/node_modules ./services/messaging/node_modules
COPY --from=builder /app/services/messaging/dist ./services/messaging/dist
USER nodejs
EXPOSE 3000
CMD ["node", "services/messaging/dist/services/messaging/src/main.js"]
