# ETAPA 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Definimos los argumentos que el QA o el CI/CD pasará
# Nueva variable: VITE_API_URL (estándar)
# Antigua variable: EXPO_PUBLIC_API_BASE_URL (compatibilidad con mobile)
ARG VITE_API_URL
ARG EXPO_PUBLIC_API_BASE_URL
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY

# Los convertimos en variables de entorno para que Expo/Vite los vea al compilar
ENV VITE_API_URL=$VITE_API_URL
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Al ejecutar este comando, Expo/Vite leerá las variables y las inyectará
RUN npm run build

# ETAPA 2: Runner
FROM nginx:stable-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]