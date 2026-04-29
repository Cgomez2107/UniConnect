# ETAPA 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Definimos los argumentos que el QA o el CI/CD pasará (Criterio #4)
ARG EXPO_PUBLIC_API_BASE_URL
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY

# Los convertimos en variables de entorno para que Expo los vea al compilar
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Al ejecutar este comando, Expo leerá las variables EXPO_PUBLIC_ y las inyectará
RUN npm run build

# ETAPA 2: Runner
FROM nginx:stable-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]