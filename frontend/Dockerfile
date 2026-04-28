# ETAPA 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Definimos el argumento que el QA o el CI/CD pasará (Criterio #4)
ARG VITE_API_URL
# Lo convertimos en variable de entorno para que Vite lo vea al compilar
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Al ejecutar este comando, Vite leerá el ENV VITE_API_URL y lo inyectará
RUN npm run build

# ETAPA 2: Runner
FROM nginx:stable-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]