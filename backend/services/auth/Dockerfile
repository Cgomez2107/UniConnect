# Build service image for auth
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9.12.0 && pnpm config set store-dir /pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY services/auth/package.json services/auth/tsconfig.json ./services/auth/
COPY shared ./shared
COPY services/auth/src ./services/auth/src

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @uniconnect/auth build
RUN pnpm prune --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3102
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/auth/node_modules ./services/auth/node_modules
COPY --from=builder /app/services/auth/dist ./services/auth/dist

USER nodejs
EXPOSE ${PORT}
CMD ["node", "services/auth/dist/services/auth/src/main.js"]
