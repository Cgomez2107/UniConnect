FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo root files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy shared packages
COPY packages/ packages/
COPY web/ web/

# Install all dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter "@uniconnect/*" build

# Build web app with VITE_API_URL
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter web build

FROM nginx:stable-alpine AS runner
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]