# Build service image for auth
FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm@9.12.0
RUN pnpm config set store-dir /pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY services/auth/package.json services/auth/tsconfig.json ./services/auth/
COPY shared ./shared
COPY services/auth/src ./services/auth/src

RUN pnpm install --frozen-lockfile
RUN pnpm --dir services/auth install --frozen-lockfile --prod
RUN pnpm --filter @uniconnect/auth build
RUN mkdir -p services/auth/dist && cp services/auth/dist/services/auth/src/main.js services/auth/dist/main.js

ENV NODE_ENV=production PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
EXPOSE 3000
CMD ["node", "services/auth/dist/services/auth/src/main.js"]
