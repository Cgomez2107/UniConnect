# Build service image for study-groups
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9.12.0 && pnpm config set store-dir /pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY shared ./shared
COPY services/study-groups/package.json services/study-groups/tsconfig.json ./services/study-groups/
COPY services/study-groups/src ./services/study-groups/src

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @uniconnect/study-groups build
RUN pnpm prune --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/study-groups/node_modules ./services/study-groups/node_modules
COPY --from=builder /app/services/study-groups/dist ./services/study-groups/dist

USER nodejs
EXPOSE 3000
CMD ["node", "services/study-groups/dist/services/study-groups/src/main.js"]